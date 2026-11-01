import { DocumentsService } from '../src/modules/documents/documents.service';
import { PrivateDiskStorageAdapter } from '../src/modules/documents/storage/private-disk-storage.adapter';
import { DefaultMalwareScanner } from '../src/modules/documents/scanner/default-malware-scanner';
import { Document } from '../src/database/entities/document.entity';
import { AuditEvent } from '../src/database/entities/audit-event.entity';
import { Repository } from 'typeorm';
import { DocumentType, DocumentStatus, RetentionPolicy, PlatformRole } from '@ecoride/contracts';
import {
  BadRequestException,
  ForbiddenException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('Secure Document Upload & Access (EV-022 Unit Tests)', () => {
  let service: DocumentsService;
  let storageAdapter: PrivateDiskStorageAdapter;
  let malwareScanner: DefaultMalwareScanner;
  let mockDocRepo: Partial<Repository<Document>>;
  let mockAuditRepo: Partial<Repository<AuditEvent>>;

  const captainActor: CurrentActorPayload = {
    id: '11111111-1111-1111-1111-111111111111',
    role: PlatformRole.CAPTAIN,
    scopes: ['driver:self', 'document:upload:self'],
  };

  const otherRiderActor: CurrentActorPayload = {
    id: '22222222-2222-2222-2222-222222222222',
    role: PlatformRole.RIDER,
    scopes: ['rider:self'],
  };

  const operatorActor: CurrentActorPayload = {
    id: '33333333-3333-3333-3333-333333333333',
    role: PlatformRole.OPERATOR,
    scopes: ['kyc:read', 'kyc:write'],
  };

  // Valid file sample buffers
  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF');

  // Spoofed and malicious sample buffers
  const spoofedExeBuffer = Buffer.from([
    0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
  ]); // "MZ" DOS executable header
  const spoofedScriptBuffer = Buffer.from('#!/bin/bash\nrm -rf /');
  const spoofedHtmlBuffer = Buffer.from('<html><script>alert("xss")</script></html>');
  const eicarMalwareBuffer = Buffer.from(
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
  );

  beforeEach(() => {
    storageAdapter = new PrivateDiskStorageAdapter({
      baseDir: './data/test_storage_' + Date.now(),
      signingSecret: 'test_hmac_secret_key_for_testing_purposes_123',
    });
    malwareScanner = new DefaultMalwareScanner();

    mockDocRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'doc-uuid-1234',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (entity) => ({
        id: entity.id || 'doc-uuid-1234',
        createdAt: entity.createdAt || new Date(),
        updatedAt: new Date(),
        ...entity,
      })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
    };

    mockAuditRepo = {
      create: jest.fn().mockImplementation((e) => e),
      save: jest.fn().mockResolvedValue({}),
    };

    service = new DocumentsService(
      mockDocRepo as Repository<Document>,
      mockAuditRepo as Repository<AuditEvent>,
      storageAdapter,
      malwareScanner,
    );
  });

  describe('PrivateDiskStorageAdapter & Signed Temporary Access', () => {
    it('should store, retrieve, and delete private objects', async () => {
      const testKey = 'test/captain/license.jpg';
      const testData = Buffer.from('test-private-kyc-content');

      await storageAdapter.putObject(testKey, testData, { owner: 'captain1' });

      expect(await storageAdapter.objectExists(testKey)).toBe(true);

      const retrieved = await storageAdapter.getObject(testKey);
      expect(retrieved.data.toString()).toBe('test-private-kyc-content');

      await storageAdapter.deleteObject(testKey);
      expect(await storageAdapter.objectExists(testKey)).toBe(false);
    });

    it('should generate valid HMAC-SHA256 signed access tokens', () => {
      const exp = Date.now() + 60000;
      const token = storageAdapter.generateSignedToken({
        documentId: 'doc-1',
        storageKey: 'kyc/doc1.jpg',
        userId: 'user-1',
        exp,
      });

      expect(token).toBeDefined();
      expect(token).toContain('.');

      const result = storageAdapter.verifySignedToken(token);
      expect(result.isValid).toBe(true);
      expect(result.payload?.documentId).toBe('doc-1');
      expect(result.payload?.storageKey).toBe('kyc/doc1.jpg');
    });

    it('should reject expired signed access tokens', () => {
      const pastExp = Date.now() - 5000; // 5 seconds ago
      const token = storageAdapter.generateSignedToken({
        documentId: 'doc-expired',
        storageKey: 'kyc/expired.jpg',
        userId: 'user-1',
        exp: pastExp,
      });

      const result = storageAdapter.verifySignedToken(token);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject tampered signed access tokens', () => {
      const exp = Date.now() + 60000;
      const validToken = storageAdapter.generateSignedToken({
        documentId: 'doc-original',
        storageKey: 'kyc/original.jpg',
        userId: 'user-1',
        exp,
      });

      // Tamper signature
      const tamperedSignatureToken = validToken.substring(0, validToken.length - 4) + 'XXXX';
      const result = storageAdapter.verifySignedToken(tamperedSignatureToken);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid or tampered signed access token');

      // Tamper payload
      const [, sig] = validToken.split('.');
      const modifiedPayload = Buffer.from(
        JSON.stringify({ documentId: 'doc-HACKED', storageKey: 'kyc/hacked.jpg', exp }),
      ).toString('base64url');
      const tamperedPayloadToken = `${modifiedPayload}.${sig}`;

      const result2 = storageAdapter.verifySignedToken(tamperedPayloadToken);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('Invalid or tampered signed access token');
    });
  });

  describe('DefaultMalwareScanner Integration Point', () => {
    it('should approve clean document buffers', async () => {
      const result = await malwareScanner.scan(validPdfBuffer, 'permit.pdf');
      expect(result.isClean).toBe(true);
      expect(result.scanStatus).toBe(DocumentStatus.CLEAN);
      expect(result.threatName).toBeUndefined();
    });

    it('should detect synthetic EICAR test signature and mark INFECTED', async () => {
      const result = await malwareScanner.scan(eicarMalwareBuffer, 'fake_license.jpg');
      expect(result.isClean).toBe(false);
      expect(result.scanStatus).toBe(DocumentStatus.INFECTED);
      expect(result.threatName).toContain('EICAR');
    });

    it('should detect suspicious executable launch payloads in documents', async () => {
      const suspiciousPdf = Buffer.from('%PDF-1.4\n/Launch /Action /F (cmd.exe)\n%%EOF');
      const result = await malwareScanner.scan(suspiciousPdf, 'exploit.pdf');
      expect(result.isClean).toBe(false);
      expect(result.scanStatus).toBe(DocumentStatus.INFECTED);
      expect(result.threatName).toContain('Exploit.PDF');
    });
  });

  describe('Magic Bytes Inspection & Anti-Spoofing', () => {
    it('should approve authentic JPEG, PNG, and PDF files', () => {
      expect(service.inspectMagicBytes(validJpegBuffer, 'image/jpeg').isValid).toBe(true);
      expect(service.inspectMagicBytes(validPngBuffer, 'image/png').isValid).toBe(true);
      expect(service.inspectMagicBytes(validPdfBuffer, 'application/pdf').isValid).toBe(true);
    });

    it('should reject Windows PE executable disguised with image/jpeg', () => {
      const result = service.inspectMagicBytes(spoofedExeBuffer, 'image/jpeg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('spoofing detected');
      expect(result.detectedMimeType).toBe('application/x-dosexec');
    });

    it('should reject executable shell script disguised with image/png', () => {
      const result = service.inspectMagicBytes(spoofedScriptBuffer, 'image/png');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('spoofing detected');
      expect(result.detectedMimeType).toBe('text/x-shellscript');
    });

    it('should reject HTML/Script markup disguised as application/pdf', () => {
      const result = service.inspectMagicBytes(spoofedHtmlBuffer, 'application/pdf');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('spoofing detected');
    });

    it('should reject mismatched content (e.g. PDF file claimed as image/jpeg)', () => {
      const result = service.inspectMagicBytes(validPdfBuffer, 'image/jpeg');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(
        "claimed 'image/jpeg' but file header indicates 'application/pdf'",
      );
    });
  });

  describe('Upload Size Limits & Upload Workflow', () => {
    it('should successfully upload valid document and persist metadata', async () => {
      const result = await service.uploadDocument(captainActor, {
        documentType: DocumentType.DRIVING_LICENSE,
        filename: 'license.jpg',
        mimeType: 'image/jpeg',
        contentBase64: validJpegBuffer.toString('base64'),
        retentionPolicy: RetentionPolicy.KYC_STATUTORY_5_YEARS,
      });

      expect(result).toBeDefined();
      expect(result.userId).toBe(captainActor.id);
      expect(result.documentType).toBe(DocumentType.DRIVING_LICENSE);
      expect(result.scanStatus).toBe(DocumentStatus.CLEAN);
      expect(result.sha256Checksum).toHaveLength(64);
      expect(result.expiresAt).toBeDefined();
    });

    it('should reject oversized uploads exceeding 5 MB limit', async () => {
      // 5.5 MB buffer
      const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024);
      oversizedBuffer[0] = 0xff;
      oversizedBuffer[1] = 0xd8;
      oversizedBuffer[2] = 0xff;

      await expect(
        service.uploadDocument(captainActor, {
          documentType: DocumentType.GREEN_PLATE_PERMIT,
          filename: 'permit_giant.jpg',
          mimeType: 'image/jpeg',
          contentBase64: oversizedBuffer.toString('base64'),
        }),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('should reject upload when extension spoofing is detected', async () => {
      await expect(
        service.uploadDocument(captainActor, {
          documentType: DocumentType.AADHAAR,
          filename: 'aadhaar.jpg',
          mimeType: 'image/jpeg',
          contentBase64: spoofedExeBuffer.toString('base64'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject upload when malware is detected', async () => {
      // Buffer starting with JPEG header but containing EICAR
      const infectedJpeg = Buffer.concat([validJpegBuffer, eicarMalwareBuffer]);

      await expect(
        service.uploadDocument(captainActor, {
          documentType: DocumentType.PAN,
          filename: 'pan_card.jpg',
          mimeType: 'image/jpeg',
          contentBase64: infectedJpeg.toString('base64'),
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('Access Control, Ownership Isolation, and Retention Expiry', () => {
    it('should allow document owner to generate signed temporary access link', async () => {
      const mockDoc: Document = {
        id: 'doc-123',
        userId: captainActor.id,
        documentType: DocumentType.GREEN_PLATE_PERMIT,
        originalFilename: 'permit.pdf',
        storageKey: 'kyc/permit.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        sha256Checksum: 'abcdef',
        scanStatus: DocumentStatus.CLEAN,
        retentionPolicy: RetentionPolicy.KYC_STATUTORY_5_YEARS,
        expiresAt: new Date(Date.now() + 1000000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockDocRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);

      const res = await service.getPresignedAccessUrl(captainActor, 'doc-123', 900);
      expect(res.url).toContain('/v1/documents/download?token=');
      expect(res.token).toBeDefined();
    });

    it('should allow OPERATOR to access KYC document for verification review', async () => {
      const mockDoc: Document = {
        id: 'doc-123',
        userId: captainActor.id,
        documentType: DocumentType.DRIVING_LICENSE,
        originalFilename: 'license.jpg',
        storageKey: 'kyc/license.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 2048,
        sha256Checksum: '123456',
        scanStatus: DocumentStatus.CLEAN,
        retentionPolicy: RetentionPolicy.KYC_STATUTORY_5_YEARS,
        expiresAt: new Date(Date.now() + 1000000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockDocRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);

      const res = await service.getPresignedAccessUrl(operatorActor, 'doc-123');
      expect(res.token).toBeDefined();
    });

    it("should refuse cross-account access when Rider B tries to access Captain A's document", async () => {
      const mockDoc: Document = {
        id: 'doc-123',
        userId: captainActor.id,
        documentType: DocumentType.DRIVING_LICENSE,
        originalFilename: 'license.jpg',
        storageKey: 'kyc/license.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 2048,
        sha256Checksum: '123456',
        scanStatus: DocumentStatus.CLEAN,
        retentionPolicy: RetentionPolicy.KYC_STATUTORY_5_YEARS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockDocRepo.findOne as jest.Mock).mockResolvedValue(mockDoc);

      await expect(service.getPresignedAccessUrl(otherRiderActor, 'doc-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should refuse access when document retention period has expired', async () => {
      const expiredDoc: Document = {
        id: 'doc-expired-retention',
        userId: captainActor.id,
        documentType: DocumentType.DRIVING_LICENSE,
        originalFilename: 'old_license.jpg',
        storageKey: 'kyc/old_license.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 1024,
        sha256Checksum: 'old',
        scanStatus: DocumentStatus.CLEAN,
        retentionPolicy: RetentionPolicy.TEMPORARY_90_DAYS,
        expiresAt: new Date(Date.now() - 100000), // In the past!
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockDocRepo.findOne as jest.Mock).mockResolvedValue(expiredDoc);

      await expect(
        service.getPresignedAccessUrl(captainActor, 'doc-expired-retention'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should evaluate retention policies and mark expired documents', async () => {
      const expiredDocs: Document[] = [
        {
          id: 'doc-exp-1',
          userId: 'user-1',
          documentType: DocumentType.PROFILE_PHOTO,
          originalFilename: 'photo.jpg',
          storageKey: 'kyc/photo.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 500,
          sha256Checksum: 'sum',
          scanStatus: DocumentStatus.CLEAN,
          retentionPolicy: RetentionPolicy.TEMPORARY_90_DAYS,
          expiresAt: new Date(Date.now() - 5000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockDocRepo.find as jest.Mock).mockResolvedValue(expiredDocs);

      const result = await service.evaluateRetentionPolicies(operatorActor);
      expect(result.expiredCount).toBe(1);
      expect(result.purgedKeys).toContain('kyc/photo.jpg');
      expect(expiredDocs[0].scanStatus).toBe(DocumentStatus.EXPIRED);
    });
  });
});
