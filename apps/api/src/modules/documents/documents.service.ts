import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import * as path from 'path';
import { Document } from '../../database/entities/document.entity';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import {
  DocumentType,
  DocumentStatus,
  RetentionPolicy,
  DocumentMetadataDto,
  PresignedAccessDto,
  PresignedUploadResponse,
  PaginatedDocumentsDto,
  PlatformRole,
} from '@ecoride/contracts';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import { PrivateDiskStorageAdapter } from './storage/private-disk-storage.adapter';
import { DefaultMalwareScanner } from './scanner/default-malware-scanner';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { PresignedUploadDto } from './dto/presigned-access.dto';
import { DocumentsPaginationDto } from './dto/pagination-query.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  // Maximum upload size: 5 MB (5,242,880 bytes)
  public static readonly MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

  // Allowed MIME types for KYC and official vehicle documents
  public static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'image/webp',
  ];

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    private readonly storageAdapter: PrivateDiskStorageAdapter,
    private readonly malwareScanner: DefaultMalwareScanner,
  ) {}

  /**
   * Inspect file binary header (magic bytes) to prevent extension spoofing and executable uploads.
   */
  inspectMagicBytes(
    buffer: Buffer,
    claimedMimeType: string,
    _filename?: string,
  ): { isValid: boolean; detectedMimeType?: string; error?: string } {
    if (!buffer || buffer.length < 4) {
      return { isValid: false, error: 'Empty or truncated file content' };
    }

    const normalizedClaimed = claimedMimeType.toLowerCase().trim();

    // 1. Proactive check for dangerous executable / script signatures
    // Windows PE Executable (MZ header: 0x4D, 0x5A)
    if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
      return {
        isValid: false,
        detectedMimeType: 'application/x-dosexec',
        error:
          'Extension or MIME type spoofing detected: Windows executable (MZ) disguised as document',
      };
    }

    // Unix ELF Executable (0x7F, 'E', 'L', 'F')
    if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
      return {
        isValid: false,
        detectedMimeType: 'application/x-elf',
        error:
          'Extension or MIME type spoofing detected: ELF binary executable disguised as document',
      };
    }

    // Shell script shebang (#! / 0x23, 0x21)
    if (buffer[0] === 0x23 && buffer[1] === 0x21) {
      return {
        isValid: false,
        detectedMimeType: 'text/x-shellscript',
        error: 'Extension or MIME type spoofing detected: executable script disguised as document',
      };
    }

    // HTML / Script injection check
    const headerString = buffer.subarray(0, 32).toString('utf8').toLowerCase();
    if (
      headerString.includes('<html') ||
      headerString.includes('<!doctype') ||
      headerString.includes('<script')
    ) {
      return {
        isValid: false,
        detectedMimeType: 'text/html',
        error: 'Extension or MIME type spoofing detected: HTML/Script markup disguised as document',
      };
    }

    // 2. Detect authentic document magic bytes
    let detectedType: string | undefined;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      detectedType = 'image/jpeg';
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    else if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      detectedType = 'image/png';
    }
    // PDF: %PDF (0x25, 0x50, 0x44, 0x46)
    else if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      detectedType = 'application/pdf';
    }
    // WebP: RIFF .... WEBP
    else if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      detectedType = 'image/webp';
    }

    if (!detectedType) {
      return {
        isValid: false,
        error: `File signature does not match any allowed document types (${DocumentsService.ALLOWED_MIME_TYPES.join(', ')})`,
      };
    }

    // Compare detected MIME type against claimed MIME type
    const isJpegMatch =
      detectedType === 'image/jpeg' &&
      (normalizedClaimed === 'image/jpeg' || normalizedClaimed === 'image/jpg');

    if (detectedType !== normalizedClaimed && !isJpegMatch) {
      return {
        isValid: false,
        detectedMimeType: detectedType,
        error: `Extension or MIME type spoofing detected: claimed '${claimedMimeType}' but file header indicates '${detectedType}'`,
      };
    }

    return { isValid: true, detectedMimeType: detectedType };
  }

  /**
   * Upload and process a secure KYC document with size checks, anti-spoofing, and malware scanning.
   */
  async uploadDocument(
    actor: CurrentActorPayload,
    dto: UploadDocumentDto,
  ): Promise<DocumentMetadataDto> {
    // 1. Decode base64 buffer
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(dto.contentBase64, 'base64');
    } catch {
      throw new BadRequestException('Invalid base64 encoding in contentBase64 payload');
    }

    // 2. Strict file size check
    if (fileBuffer.length > DocumentsService.MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        `File size (${fileBuffer.length} bytes) exceeds maximum allowed limit of ${DocumentsService.MAX_FILE_SIZE_BYTES} bytes (5 MB)`,
      );
    }

    if (fileBuffer.length === 0) {
      throw new BadRequestException('Uploaded file cannot be empty (0 bytes)');
    }

    // 3. Magic bytes inspection & anti-spoofing
    const inspection = this.inspectMagicBytes(fileBuffer, dto.mimeType, dto.filename);
    if (!inspection.isValid) {
      await this.recordAuditEvent({
        actorId: actor.id,
        targetUserId: actor.id,
        action: 'DOCUMENT_SPOOFING_REJECTED',
        entityType: 'DOCUMENT',
        entityId: dto.filename,
        status: 'DENIED',
        failureReason: inspection.error,
        newState: {
          filename: dto.filename,
          claimedMime: dto.mimeType,
          detected: inspection.detectedMimeType,
        },
      });

      throw new BadRequestException(inspection.error);
    }

    // 4. Malware scanning integration point
    const scanResult = await this.malwareScanner.scan(fileBuffer, dto.filename);
    if (!scanResult.isClean) {
      await this.recordAuditEvent({
        actorId: actor.id,
        targetUserId: actor.id,
        action: 'DOCUMENT_MALWARE_REJECTED',
        entityType: 'DOCUMENT',
        entityId: dto.filename,
        status: 'DENIED',
        failureReason: scanResult.threatName,
        newState: {
          threatName: scanResult.threatName,
          engine: scanResult.engine,
          filename: dto.filename,
        },
      });

      throw new UnprocessableEntityException(
        `Malware scan failed: ${scanResult.threatName} detected in uploaded document`,
      );
    }

    // 5. Compute SHA256 cryptographic checksum
    const sha256Checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 6. Generate secure isolated storage key
    const fileExt =
      path.extname(dto.filename).toLowerCase() || this.getExtensionFromMime(dto.mimeType);
    const storageKey = `kyc/${actor.id}/${dto.documentType.toLowerCase()}_${Date.now()}_${crypto.randomUUID()}${fileExt}`;

    // 7. Store in private object storage adapter
    await this.storageAdapter.putObject(storageKey, fileBuffer, {
      userId: actor.id,
      documentType: dto.documentType,
      originalFilename: dto.filename,
      sha256: sha256Checksum,
    });

    // 8. Calculate retention policy expiration
    const retentionPolicy = dto.retentionPolicy || RetentionPolicy.KYC_STATUTORY_5_YEARS;
    const expiresAt = this.calculateExpiry(retentionPolicy);

    // 9. Persist database metadata record
    const document = this.documentRepository.create({
      userId: actor.id,
      documentType: dto.documentType,
      originalFilename: dto.filename,
      storageKey,
      mimeType: inspection.detectedMimeType || dto.mimeType,
      fileSizeBytes: fileBuffer.length,
      sha256Checksum,
      scanStatus: DocumentStatus.CLEAN,
      scanDetails: scanResult.details,
      retentionPolicy,
      expiresAt,
    });

    const saved = await this.documentRepository.save(document);

    // 10. Record authoritative security audit event
    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: actor.id,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'DOCUMENT',
      entityId: saved.id,
      status: 'SUCCESS',
      newState: {
        documentId: saved.id,
        documentType: saved.documentType,
        storageKey: saved.storageKey,
        fileSizeBytes: saved.fileSizeBytes,
        retentionPolicy: saved.retentionPolicy,
        expiresAt: saved.expiresAt?.toISOString(),
      },
    });

    return this.mapToDto(saved);
  }

  /**
   * Request presigned upload metadata for client-side direct upload workflow.
   */
  async createPresignedUpload(
    actor: CurrentActorPayload,
    dto: PresignedUploadDto,
  ): Promise<PresignedUploadResponse> {
    if (dto.fileSizeBytes > DocumentsService.MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeException(
        `Requested upload size (${dto.fileSizeBytes} bytes) exceeds maximum allowed limit of ${DocumentsService.MAX_FILE_SIZE_BYTES} bytes (5 MB)`,
      );
    }

    if (!DocumentsService.ALLOWED_MIME_TYPES.includes(dto.mimeType.toLowerCase())) {
      throw new BadRequestException(
        `Requested MIME type '${dto.mimeType}' is not supported. Allowed: ${DocumentsService.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    const fileExt =
      path.extname(dto.filename).toLowerCase() || this.getExtensionFromMime(dto.mimeType);
    const storageKey = `kyc/${actor.id}/${dto.documentType.toLowerCase()}_${Date.now()}_${crypto.randomUUID()}${fileExt}`;
    const expiresAt = new Date(Date.now() + 900 * 1000); // 15-minute ticket

    const uploadToken = this.storageAdapter.generateSignedToken({
      documentId: 'pending_upload',
      storageKey,
      userId: actor.id,
      exp: expiresAt.getTime(),
    });

    return {
      uploadUrl: `/v1/documents/upload`,
      storageKey,
      uploadToken,
      expiresAt: expiresAt.toISOString(),
      maxSizeBytes: DocumentsService.MAX_FILE_SIZE_BYTES,
      allowedMimeTypes: DocumentsService.ALLOWED_MIME_TYPES,
    };
  }

  /**
   * Generate temporary cryptographically signed access link (HMAC-SHA256) for KYC document.
   */
  async getPresignedAccessUrl(
    actor: CurrentActorPayload,
    documentId: string,
    expiresInSeconds = 900,
  ): Promise<PresignedAccessDto> {
    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document with id '${documentId}' not found`);
    }

    // Enforce strict account ownership & administrative role access
    this.assertCanAccessDocument(actor, document);

    // Verify statutory retention policy expiration
    if (document.expiresAt && document.expiresAt.getTime() < Date.now()) {
      await this.recordAuditEvent({
        actorId: actor.id,
        targetUserId: document.userId,
        action: 'DOCUMENT_EXPIRED_ACCESS_ATTEMPT',
        entityType: 'DOCUMENT',
        entityId: document.id,
        status: 'DENIED',
        failureReason: 'Document has expired under retention policy',
      });

      throw new ForbiddenException('Document retention period has expired');
    }

    // Generate signed temporary access token
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const token = this.storageAdapter.generateSignedToken({
      documentId: document.id,
      storageKey: document.storageKey,
      userId: document.userId,
      exp: expiresAt.getTime(),
    });

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: document.userId,
      action: 'DOCUMENT_ACCESS_LINK_GENERATED',
      entityType: 'DOCUMENT',
      entityId: document.id,
      status: 'SUCCESS',
      newState: {
        documentId: document.id,
        expiresAt: expiresAt.toISOString(),
        ttlSeconds: expiresInSeconds,
      },
    });

    return {
      url: `/v1/documents/download?token=${encodeURIComponent(token)}`,
      token,
      storageKey: document.storageKey,
      expiresAt: expiresAt.toISOString(),
      documentId: document.id,
    };
  }

  /**
   * Download and stream document by validating cryptographic signed temporary access token.
   */
  async downloadBySignedToken(token: string): Promise<{
    buffer: Buffer;
    mimeType: string;
    originalFilename: string;
    document: DocumentMetadataDto;
  }> {
    const verification = this.storageAdapter.verifySignedToken(token);
    if (!verification.isValid || !verification.payload) {
      if (verification.error?.includes('expired')) {
        throw new ForbiddenException('Signed access link has expired');
      }
      throw new ForbiddenException(verification.error || 'Invalid or tampered signed access token');
    }

    const { documentId, storageKey, userId } = verification.payload;

    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document with id '${documentId}' not found`);
    }

    // Verify retention expiry
    if (document.expiresAt && document.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Document retention period has expired');
    }

    // Retrieve object from private storage
    const storedObject = await this.storageAdapter.getObject(storageKey);

    await this.recordAuditEvent({
      actorId: userId,
      targetUserId: document.userId,
      action: 'DOCUMENT_DOWNLOADED',
      entityType: 'DOCUMENT',
      entityId: document.id,
      status: 'SUCCESS',
    });

    return {
      buffer: storedObject.data,
      mimeType: document.mimeType,
      originalFilename: document.originalFilename,
      document: this.mapToDto(document),
    };
  }

  /**
   * Direct authenticated download with role & ownership checks.
   */
  async downloadDirect(
    actor: CurrentActorPayload,
    documentId: string,
  ): Promise<{ buffer: Buffer; mimeType: string; originalFilename: string }> {
    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document with id '${documentId}' not found`);
    }

    this.assertCanAccessDocument(actor, document);

    if (document.expiresAt && document.expiresAt.getTime() < Date.now()) {
      throw new ForbiddenException('Document retention period has expired');
    }

    const storedObject = await this.storageAdapter.getObject(document.storageKey);
    return {
      buffer: storedObject.data,
      mimeType: document.mimeType,
      originalFilename: document.originalFilename,
    };
  }

  /**
   * Retrieve document metadata record with access control.
   */
  async getDocumentMetadata(
    actor: CurrentActorPayload,
    documentId: string,
  ): Promise<DocumentMetadataDto> {
    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document with id '${documentId}' not found`);
    }

    this.assertCanAccessDocument(actor, document);
    return this.mapToDto(document);
  }

  /**
   * List documents with pagination and ownership filtering.
   */
  async listDocuments(
    actor: CurrentActorPayload,
    query: DocumentsPaginationDto,
  ): Promise<PaginatedDocumentsDto> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const qb = this.documentRepository.createQueryBuilder('doc');

    // Ownership & target isolation
    if (query.userId && query.userId !== actor.id) {
      // Must be admin or have kyc:read scope
      this.assertAdminOrScope(actor, 'kyc:read');
      qb.andWhere('doc.user_id = :targetUserId', { targetUserId: query.userId });
    } else if (!this.hasAdminPrivileges(actor)) {
      // Non-admin callers only see their own documents
      qb.andWhere('doc.user_id = :selfId', { selfId: actor.id });
    }

    if (query.documentType) {
      qb.andWhere('doc.document_type = :docType', { docType: query.documentType });
    }

    qb.orderBy('doc.created_at', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((d) => this.mapToDto(d)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete document from storage and database.
   */
  async deleteDocument(actor: CurrentActorPayload, documentId: string): Promise<void> {
    const document = await this.documentRepository.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException(`Document with id '${documentId}' not found`);
    }

    this.assertCanAccessDocument(actor, document);

    // Delete from storage adapter
    await this.storageAdapter.deleteObject(document.storageKey);

    // Delete database record
    await this.documentRepository.delete(documentId);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: document.userId,
      action: 'DOCUMENT_DELETED',
      entityType: 'DOCUMENT',
      entityId: documentId,
      status: 'SUCCESS',
      previousState: {
        storageKey: document.storageKey,
        originalFilename: document.originalFilename,
      },
    });
  }

  /**
   * Evaluate retention policies and purge or mark expired documents.
   */
  async evaluateRetentionPolicies(
    actor?: CurrentActorPayload,
  ): Promise<{ expiredCount: number; purgedKeys: string[] }> {
    if (actor) {
      this.assertAdminOrScope(actor, 'kyc:write');
    }
    const now = new Date();
    const expiredDocs = await this.documentRepository.find({
      where: {
        expiresAt: LessThan(now),
      },
    });

    const purgedKeys: string[] = [];

    for (const doc of expiredDocs) {
      if (doc.scanStatus !== DocumentStatus.EXPIRED) {
        doc.scanStatus = DocumentStatus.EXPIRED;
        await this.documentRepository.save(doc);

        await this.storageAdapter.deleteObject(doc.storageKey);
        purgedKeys.push(doc.storageKey);

        await this.recordAuditEvent({
          action: 'DOCUMENT_RETENTION_EXPIRED_PURGED',
          entityType: 'DOCUMENT',
          entityId: doc.id,
          targetUserId: doc.userId,
          status: 'SUCCESS',
          newState: { storageKey: doc.storageKey, retentionPolicy: doc.retentionPolicy },
        });
      }
    }

    return {
      expiredCount: expiredDocs.length,
      purgedKeys,
    };
  }

  // ---------------------------------------------------------------------------
  // Helper & Security Assertion Methods
  // ---------------------------------------------------------------------------

  private assertCanAccessDocument(actor: CurrentActorPayload, document: Document): void {
    // 1. Owner self-access
    if (actor.id === document.userId) {
      return;
    }

    // 2. Super Admin full platform governance
    if (actor.role === PlatformRole.SUPER_ADMIN || actor.scopes.includes('*')) {
      return;
    }

    // 3. Operational review roles
    const reviewerRoles = [
      PlatformRole.OPERATOR,
      PlatformRole.SUPPORT,
      PlatformRole.SAFETY_OFFICER,
    ];
    if (reviewerRoles.includes(actor.role as PlatformRole) || actor.scopes.includes('kyc:read')) {
      return;
    }

    // 4. Unauthorized cross-account access attempt
    this.logger.warn(
      `Cross-account KYC document access denied: actor ${actor.id} (${actor.role}) tried to access document ${document.id} belonging to user ${document.userId}`,
    );

    this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: document.userId,
      action: 'CROSS_ACCOUNT_DOCUMENT_ACCESS_DENIED',
      entityType: 'DOCUMENT',
      entityId: document.id,
      status: 'DENIED',
      failureReason: 'Unauthorized cross-account document access attempt',
    }).catch(() => undefined);

    throw new ForbiddenException(
      'Cross-account access denied: you do not have permission to access this KYC document',
    );
  }

  private assertAdminOrScope(actor: CurrentActorPayload, scope: string): void {
    if (
      actor.role === PlatformRole.SUPER_ADMIN ||
      actor.scopes.includes('*') ||
      actor.scopes.includes(scope)
    ) {
      return;
    }
    throw new ForbiddenException(`Insufficient permissions: scope '${scope}' required`);
  }

  private hasAdminPrivileges(actor: CurrentActorPayload): boolean {
    return (
      actor.role === PlatformRole.SUPER_ADMIN ||
      actor.role === PlatformRole.OPERATOR ||
      actor.role === PlatformRole.SUPPORT ||
      actor.scopes.includes('*') ||
      actor.scopes.includes('kyc:read')
    );
  }

  private calculateExpiry(policy: RetentionPolicy | string): Date | null {
    const now = Date.now();
    switch (policy) {
      case RetentionPolicy.KYC_STATUTORY_5_YEARS:
        // 5 years statutory retention (5 * 365 days)
        return new Date(now + 5 * 365 * 24 * 60 * 60 * 1000);
      case RetentionPolicy.TEMPORARY_90_DAYS:
        // 90 days retention
        return new Date(now + 90 * 24 * 60 * 60 * 1000);
      case RetentionPolicy.PERMANENT_ACCOUNT_LIFETIME:
      default:
        return null;
    }
  }

  private getExtensionFromMime(mime: string): string {
    switch (mime.toLowerCase()) {
      case 'image/jpeg':
      case 'image/jpg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'application/pdf':
        return '.pdf';
      case 'image/webp':
        return '.webp';
      default:
        return '.bin';
    }
  }

  private mapToDto(doc: Document): DocumentMetadataDto {
    return {
      id: doc.id,
      userId: doc.userId,
      documentType: doc.documentType as DocumentType,
      originalFilename: doc.originalFilename,
      storageKey: doc.storageKey,
      mimeType: doc.mimeType,
      fileSizeBytes: doc.fileSizeBytes,
      sha256Checksum: doc.sha256Checksum,
      scanStatus: doc.scanStatus as DocumentStatus,
      scanDetails: doc.scanDetails,
      retentionPolicy: doc.retentionPolicy as RetentionPolicy,
      expiresAt: doc.expiresAt?.toISOString() || null,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private async recordAuditEvent(params: {
    actorId?: string;
    targetUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    status: 'SUCCESS' | 'DENIED' | 'FAILED';
    failureReason?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const event = this.auditEventRepository.create({
        actorId: params.actorId,
        targetUserId: params.targetUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        status: params.status,
        failureReason: params.failureReason,
        previousState: params.previousState,
        newState: params.newState,
      });
      await this.auditEventRepository.save(event);
    } catch (err) {
      this.logger.warn(`Failed to record audit event: ${err}`);
    }
  }
}
