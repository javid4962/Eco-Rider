import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentsController } from '../src/modules/documents/documents.controller';
import { DocumentsService } from '../src/modules/documents/documents.service';
import { PrivateDiskStorageAdapter } from '../src/modules/documents/storage/private-disk-storage.adapter';
import { DefaultMalwareScanner } from '../src/modules/documents/scanner/default-malware-scanner';
import { TokenService } from '../src/modules/auth/token.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document } from '../src/database/entities/document.entity';
import { AuditEvent } from '../src/database/entities/audit-event.entity';
import { DocumentType, DocumentStatus, RetentionPolicy, PlatformRole } from '@ecoride/contracts';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';
import { Response } from 'express';

describe('Secure Document Upload & Access Integration (EV-022 e2e)', () => {
  let app: INestApplication;
  let controller: DocumentsController;
  let service: DocumentsService;
  let storageAdapter: PrivateDiskStorageAdapter;

  const captainA: CurrentActorPayload = {
    id: 'a1000000-0000-0000-0000-000000000001',
    role: PlatformRole.CAPTAIN,
    scopes: ['driver:self', 'document:upload:self'],
  };

  const riderB: CurrentActorPayload = {
    id: 'b2000000-0000-0000-0000-000000000002',
    role: PlatformRole.RIDER,
    scopes: ['rider:self'],
  };

  const unauthenticatedActor: CurrentActorPayload = {
    id: '00000000-0000-0000-0000-000000000000',
    role: 'ANONYMOUS',
    scopes: [],
  };

  // In-memory mock repositories
  const documentsDb = new Map<string, Document>();
  const auditEventsDb: AuditEvent[] = [];

  const mockDocumentRepository = {
    create: jest.fn().mockImplementation((dto) => {
      const doc = new Document();
      doc.id = 'doc-' + Math.random().toString(36).substring(2, 9);
      doc.createdAt = new Date();
      doc.updatedAt = new Date();
      Object.assign(doc, dto);
      return doc;
    }),
    save: jest.fn().mockImplementation(async (doc: Document) => {
      documentsDb.set(doc.id, doc);
      return doc;
    }),
    findOne: jest.fn().mockImplementation(async (opts: { where: { id: string } }) => {
      return documentsDb.get(opts.where.id) || null;
    }),
    find: jest.fn().mockImplementation(async () => {
      return Array.from(documentsDb.values());
    }),
    delete: jest.fn().mockImplementation(async (id: string) => {
      const existed = documentsDb.has(id);
      documentsDb.delete(id);
      return { affected: existed ? 1 : 0 };
    }),
    createQueryBuilder: jest.fn().mockReturnValue({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockImplementation(async () => {
        const all = Array.from(documentsDb.values());
        return [all, all.length];
      }),
    }),
  };

  const mockAuditEventRepository = {
    create: jest.fn().mockImplementation((event) => event),
    save: jest.fn().mockImplementation(async (event) => {
      auditEventsDb.push(event);
      return event;
    }),
  };

  const validJpegContent = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  ]);
  const spoofedExeContent = Buffer.from([
    0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00,
  ]);

  beforeAll(async () => {
    storageAdapter = new PrivateDiskStorageAdapter({
      baseDir: './data/e2e_storage_' + Date.now(),
      signingSecret: 'e2e_test_signing_secret_hmac_2026',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        DocumentsService,
        { provide: PrivateDiskStorageAdapter, useValue: storageAdapter },
        DefaultMalwareScanner,
        TokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        { provide: getRepositoryToken(Document), useValue: mockDocumentRepository },
        { provide: getRepositoryToken(AuditEvent), useValue: mockAuditEventRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    controller = app.get<DocumentsController>(DocumentsController);
    service = app.get<DocumentsService>(DocumentsService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('1. Unauthenticated Access is Refused', () => {
    it('refuses unauthenticated access to KYC document metadata', async () => {
      // In production, JwtAuthGuard rejects with 401; here we verify unauthenticated actor cannot access KYC
      const testDoc = await service.uploadDocument(captainA, {
        documentType: DocumentType.DRIVING_LICENSE,
        filename: 'secret_license.jpg',
        mimeType: 'image/jpeg',
        contentBase64: validJpegContent.toString('base64'),
      });

      await expect(controller.getMetadata(unauthenticatedActor, testDoc.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('refuses access to signed-url generation without valid authentication', async () => {
      const testDoc = Array.from(documentsDb.values())[0];
      await expect(controller.getSignedUrl(unauthenticatedActor, testDoc.id, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('refuses download request without a valid signed token', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await expect(controller.downloadBySignedToken({ token: '' }, mockRes)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('2. Extension Spoofing Fails', () => {
    it('rejects executable disguised as JPEG with 400 Bad Request', async () => {
      await expect(
        controller.upload(captainA, {
          documentType: DocumentType.GREEN_PLATE_PERMIT,
          filename: 'permit_spoofed.jpg',
          mimeType: 'image/jpeg',
          contentBase64: spoofedExeContent.toString('base64'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects shell script disguised as PDF with 400 Bad Request', async () => {
      const scriptBuffer = Buffer.from('#!/bin/sh\necho exploit');
      await expect(
        controller.upload(captainA, {
          documentType: DocumentType.VEHICLE_RC,
          filename: 'rc_book.pdf',
          mimeType: 'application/pdf',
          contentBase64: scriptBuffer.toString('base64'),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Oversized Uploads Fail', () => {
    it('rejects upload exceeding 5 MB limit with 413 Payload Too Large', async () => {
      const oversized = Buffer.alloc(6 * 1024 * 1024);
      oversized[0] = 0xff;
      oversized[1] = 0xd8;
      oversized[2] = 0xff;

      await expect(
        controller.upload(captainA, {
          documentType: DocumentType.COMMERCIAL_FITNESS,
          filename: 'large_fitness_certificate.jpg',
          mimeType: 'image/jpeg',
          contentBase64: oversized.toString('base64'),
        }),
      ).rejects.toThrow(PayloadTooLargeException);
    });
  });

  describe('4. Expired Signed Links Fail', () => {
    it('rejects download attempt using an expired signed token', async () => {
      const pastExp = Date.now() - 10000; // Expired 10 seconds ago
      const expiredToken = storageAdapter.generateSignedToken({
        documentId: 'doc-expired-link',
        storageKey: 'kyc/expired.jpg',
        userId: captainA.id,
        exp: pastExp,
      });

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await expect(
        controller.downloadBySignedToken({ token: expiredToken }, mockRes),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Tampered Signed Links Fail', () => {
    it('rejects download attempt using a tampered token signature', async () => {
      const validToken = storageAdapter.generateSignedToken({
        documentId: 'doc-tampered-test',
        storageKey: 'kyc/test.jpg',
        userId: captainA.id,
        exp: Date.now() + 60000,
      });

      const tamperedToken = validToken.substring(0, validToken.length - 6) + 'AAAAAA';

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await expect(
        controller.downloadBySignedToken({ token: tamperedToken }, mockRes),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('6. Cross-Account Access Refusal', () => {
    it("prevents Rider B from generating a signed URL for Captain A's KYC document", async () => {
      const uploaded = await controller.upload(captainA, {
        documentType: DocumentType.AADHAAR,
        filename: 'aadhaar_card.jpg',
        mimeType: 'image/jpeg',
        contentBase64: validJpegContent.toString('base64'),
      });

      await expect(controller.getSignedUrl(riderB, uploaded.id, {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('7. End-to-End Successful KYC Document Lifecycle', () => {
    it('completes upload, presigned link generation, and token download', async () => {
      // 1. Upload valid driving license
      const uploaded = await controller.upload(captainA, {
        documentType: DocumentType.DRIVING_LICENSE,
        filename: 'ap_transport_license.jpg',
        mimeType: 'image/jpeg',
        contentBase64: validJpegContent.toString('base64'),
        retentionPolicy: RetentionPolicy.KYC_STATUTORY_5_YEARS,
      });

      expect(uploaded.id).toBeDefined();
      expect(uploaded.scanStatus).toBe(DocumentStatus.CLEAN);

      // 2. Generate signed temporary access link
      const signedLink = await controller.getSignedUrl(captainA, uploaded.id, {
        expiresInSeconds: 300,
      });

      expect(signedLink.url).toContain('/v1/documents/download?token=');
      expect(signedLink.token).toBeDefined();

      // 3. Download using signed token
      let sentBuffer: Buffer | null = null;
      let sentContentType = '';

      const mockRes = {
        setHeader: jest.fn().mockImplementation((header: string, val: unknown) => {
          if (header.toLowerCase() === 'content-type') {
            sentContentType = String(val);
          }
        }),
        send: jest.fn().mockImplementation((buf: Buffer) => {
          sentBuffer = buf;
        }),
      } as unknown as Response;

      await controller.downloadBySignedToken({ token: signedLink.token }, mockRes);

      expect(sentBuffer).not.toBeNull();
      expect(sentContentType).toBe('image/jpeg');
      expect(sentBuffer!.toString('hex')).toBe(validJpegContent.toString('hex'));

      // 4. Delete document
      const deleteResult = await controller.deleteDocument(captainA, uploaded.id);
      expect(deleteResult.success).toBe(true);

      // 5. Subsequent metadata retrieval fails with 404
      await expect(controller.getMetadata(captainA, uploaded.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
