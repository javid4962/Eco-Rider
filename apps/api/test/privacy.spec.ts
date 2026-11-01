import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { PrivacyService } from '../src/modules/privacy/privacy.service';
import {
  User,
  Consent,
  AuditEvent,
  Session,
  SavedLocation,
  Booking,
  DataDeletionRequest,
} from '../src/database/entities';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';
import { ConsentType } from '@ecoride/contracts';

describe('PrivacyService Unit Tests (EV-020)', () => {
  let service: PrivacyService;

  const riderA: CurrentActorPayload = {
    id: 'a0000000-0000-0000-0000-000000000001',
    role: 'RIDER',
    scopes: ['rider:self', 'booking:create', 'booking:read:self', 'consent:write:self'],
  };

  const riderB: CurrentActorPayload = {
    id: 'b0000000-0000-0000-0000-000000000002',
    role: 'RIDER',
    scopes: ['rider:self', 'booking:create', 'booking:read:self', 'consent:write:self'],
  };

  const supportAgent: CurrentActorPayload = {
    id: 's0000000-0000-0000-0000-000000000001',
    role: 'SUPPORT',
    scopes: ['rider:read', 'consent:read', 'privacy:read', 'audit:read'],
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockConsentRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest
      .fn()
      .mockImplementation((dto) => ({ id: 'c0000000-0000-0000-0000-000000000001', ...dto })),
    save: jest
      .fn()
      .mockImplementation((dto) =>
        Promise.resolve({ id: 'c0000000-0000-0000-0000-000000000001', ...dto }),
      ),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockAuditEventRepo = {
    create: jest.fn().mockImplementation((dto) => ({ id: 'aud-001', ...dto })),
    save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'aud-001', ...dto })),
  };

  const mockSessionRepo = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  const mockSavedLocationRepo = {
    delete: jest.fn().mockResolvedValue({ affected: 2 }),
  };

  const mockBookingRepo = {
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockDeletionRequestRepo = {
    create: jest.fn().mockImplementation((dto) => ({ id: 'del-req-001', ...dto })),
    save: jest.fn().mockImplementation((dto) => Promise.resolve({ id: 'del-req-001', ...dto })),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Consent), useValue: mockConsentRepo },
        { provide: getRepositoryToken(AuditEvent), useValue: mockAuditEventRepo },
        { provide: getRepositoryToken(Session), useValue: mockSessionRepo },
        { provide: getRepositoryToken(SavedLocation), useValue: mockSavedLocationRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: getRepositoryToken(DataDeletionRequest), useValue: mockDeletionRequestRepo },
      ],
    }).compile();

    service = module.get<PrivacyService>(PrivacyService);
  });

  describe('1. Policy Versions & Notices', () => {
    it('should return all platform policy versions with mandatory vs optional classification', () => {
      const policies = service.getPolicyVersions();

      expect(policies.length).toBeGreaterThanOrEqual(6);

      const terms = policies.find((p) => p.policyType === ConsentType.TERMS_OF_SERVICE);
      expect(terms).toBeDefined();
      expect(terms?.isMandatory).toBe(true);
      expect(terms?.version).toBe('v1.2');

      const privacy = policies.find((p) => p.policyType === ConsentType.PRIVACY_POLICY);
      expect(privacy).toBeDefined();
      expect(privacy?.isMandatory).toBe(true);
      expect(privacy?.version).toBe('v1.2');

      const smsMarketing = policies.find(
        (p) => p.policyType === ConsentType.COMMUNICATIONS_MARKETING_SMS,
      );
      expect(smsMarketing).toBeDefined();
      expect(smsMarketing?.isMandatory).toBe(false);

      const nearbyOffers = policies.find(
        (p) => p.policyType === ConsentType.LOCATION_NEARBY_OFFERS,
      );
      expect(nearbyOffers).toBeDefined();
      expect(nearbyOffers?.isMandatory).toBe(false);
    });
  });

  describe('2. Consent Recording & Revocation', () => {
    it('should record an optional communications marketing opt-in', async () => {
      mockConsentRepo.findOne.mockResolvedValue(null);

      const res = await service.recordConsent(riderA, riderA.id, {
        consentType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
        consentVersion: 'v1.0',
        isGranted: true,
      });

      expect(res.consentType).toBe(ConsentType.COMMUNICATIONS_MARKETING_SMS);
      expect(res.isGranted).toBe(true);
      expect(mockAuditEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CONSENT_GRANTED' }),
      );
    });

    it('should revoke an optional consent and log audit event', async () => {
      const existingConsent = {
        id: 'c-sms-1',
        userId: riderA.id,
        consentType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
        consentVersion: 'v1.0',
        isGranted: true,
        grantedAt: new Date(),
      };
      mockConsentRepo.findOne.mockResolvedValue(existingConsent);

      const res = await service.revokeConsent(riderA, riderA.id, {
        consentType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
        reason: 'Too many SMS messages',
      });

      expect(res.isGranted).toBe(false);
      expect(res.revokedAt).toBeDefined();
      expect(mockAuditEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CONSENT_REVOKED' }),
      );
    });

    it('should block Rider A from modifying Rider B consents with 403 Forbidden', async () => {
      await expect(
        service.recordConsent(riderA, riderB.id, {
          consentType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
          consentVersion: 'v1.0',
          isGranted: true,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockAuditEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CROSS_ACCOUNT_ACCESS_DENIED' }),
      );
    });

    it('should allow authorized SUPPORT agent to retrieve user consents', async () => {
      mockConsentRepo.find.mockResolvedValue([
        {
          id: 'c-sup-1',
          userId: riderB.id,
          consentType: ConsentType.TERMS_OF_SERVICE,
          consentVersion: 'v1.2',
          isGranted: true,
          grantedAt: new Date(),
        },
      ]);

      const res = await service.getUserConsents(supportAgent, riderB.id);
      expect(res).toHaveLength(1);
      expect(res[0].consentType).toBe(ConsentType.TERMS_OF_SERVICE);
    });
  });

  describe('3. DEMONSTRATE ACCEPTANCE: Revoked Optional Permissions Are Respected', () => {
    it('should return isAllowed=false when an optional marketing permission was revoked', async () => {
      mockConsentRepo.findOne.mockResolvedValue({
        userId: riderA.id,
        consentType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
        consentVersion: 'v1.0',
        isGranted: false,
        revokedAt: new Date('2026-11-01T10:00:00Z'),
        updatedAt: new Date('2026-11-01T10:00:00Z'),
      });

      const result = await service.evaluatePermission(riderA, riderA.id, 'MARKETING_SMS');

      expect(result.isAllowed).toBe(false);
      expect(result.consentStatus).toBe('REVOKED');
      expect(result.reason).toContain('explicitly revoked');
    });

    it('should return isAllowed=false when optional permission was never granted (opt-in required)', async () => {
      mockConsentRepo.findOne.mockResolvedValue(null);

      const result = await service.evaluatePermission(riderA, riderA.id, 'LOCATION_NEARBY_OFFERS');

      expect(result.isAllowed).toBe(false);
      expect(result.consentStatus).toBe('NOT_RECORDED');
      expect(result.reason).toContain('Opt-in is required');
    });

    it('should return isAllowed=true when optional permission is actively granted', async () => {
      mockConsentRepo.findOne.mockResolvedValue({
        userId: riderA.id,
        consentType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
        consentVersion: 'v1.0',
        isGranted: true,
        grantedAt: new Date('2026-11-01T08:00:00Z'),
        updatedAt: new Date('2026-11-01T08:00:00Z'),
      });

      const result = await service.evaluatePermission(riderA, riderA.id, 'MARKETING_SMS');

      expect(result.isAllowed).toBe(true);
      expect(result.consentStatus).toBe('GRANTED');
      expect(result.reason).toContain('Active consent granted');
    });
  });

  describe('4. Personal Data Export (DPDP Data Portability)', () => {
    it('should export full user portfolio with masked phone and no secret hashes', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: riderA.id,
        phone: '+919876543210',
        email: 'rider@example.com',
        name: 'Rider Ananya',
        role: 'RIDER',
        isActive: true,
        createdAt: new Date('2026-01-01'),
        riderProfile: {
          preferredLanguage: 'te',
          preferredPaymentMode: 'UPI',
          accessibilityNeeds: false,
          createdAt: new Date('2026-01-01'),
        },
        consents: [
          {
            consentType: 'PRIVACY_POLICY',
            consentVersion: 'v1.2',
            isGranted: true,
            grantedAt: new Date('2026-01-01'),
          },
        ],
        savedLocations: [
          {
            id: 'loc-1',
            label: 'Home',
            addressType: 'PICKUP',
            addressLine: 'Siripuram, Visakhapatnam',
            latitude: '17.7212',
            longitude: '83.3155',
            createdAt: new Date('2026-01-02'),
          },
        ],
        sessions: [
          {
            deviceId: 'dev_android_123',
            platform: 'ANDROID',
            lastActiveAt: new Date(),
            createdAt: new Date(),
          },
        ],
      });
      mockBookingRepo.count.mockResolvedValueOnce(5).mockResolvedValueOnce(5);

      const exportData = await service.exportUserData(riderA, riderA.id);

      expect(exportData.exportId).toBeDefined();
      expect(exportData.statutoryBasis).toContain('Digital Personal Data Protection');
      expect(exportData.user.phoneMasked).toBe('+91*****3210');
      expect(exportData.user.name).toBe('Rider Ananya');
      expect(exportData.riderProfile?.preferredLanguage).toBe('te');
      expect(exportData.savedLocations).toHaveLength(1);
      expect(exportData.bookingsSummary.totalBookings).toBe(5);

      expect(mockAuditEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DATA_EXPORT_REQUESTED', status: 'SUCCESS' }),
      );
    });

    it('should block Rider A from exporting Rider B data with 403 Forbidden', async () => {
      await expect(service.exportUserData(riderA, riderB.id)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Data Deletion Workflow & Mandatory Retention Exceptions', () => {
    it('RETENTION EXCEPTION: should reject deletion request when user has an active ride in progress', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: riderA.id, isActive: true });
      mockBookingRepo.findOne.mockResolvedValue({
        id: 'bk-active-123',
        bookingCode: 'BK-ACT-999',
        status: 'IN_PROGRESS',
      });

      await expect(
        service.createDeletionRequest(riderA, riderA.id, {
          reason: 'Deleting account',
          confirmUnderstandRetention: true,
        }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(mockDeletionRequestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'REJECTED',
          rejectionReason: expect.stringContaining('Active ride in progress'),
        }),
      );

      expect(mockAuditEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DATA_DELETION_REJECTED',
          status: 'DENIED',
        }),
      );
    });

    it('DEMONSTRATE ACCEPTANCE: should execute erasure and disclose mandatory retention exceptions when eligible', async () => {
      const mockUser = {
        id: riderA.id,
        phone: '+919876543210',
        email: 'rider@example.com',
        name: 'Rider Ananya',
        isActive: true,
      };
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockBookingRepo.findOne.mockResolvedValue(null); // No active ride

      const receipt = await service.createDeletionRequest(riderA, riderA.id, {
        reason: 'Relocating to another state',
        confirmUnderstandRetention: true,
      });

      // 1. Verify status and erased items
      expect(receipt.status).toBe('COMPLETED');
      expect(receipt.erasedItems).toEqual(
        expect.arrayContaining([
          'RIDER_PROFILE_PERSONAL_PREFERENCES',
          'SAVED_PICKUP_AND_DROP_LOCATIONS',
          'ACTIVE_DEVICE_SESSIONS',
          'OPTIONAL_COMMUNICATION_CONSENTS',
          'CONTACT_PHONE_AND_EMAIL_PSEUDONYMIZED',
        ]),
      );

      // 2. Verify mandatory retention exceptions are explicitly disclosed
      expect(receipt.mandatoryRetentionExceptions).toBeDefined();
      expect(receipt.mandatoryRetentionExceptions.length).toBeGreaterThanOrEqual(2);

      const taxRetention = receipt.mandatoryRetentionExceptions.find(
        (r) => r.category === 'FINANCIAL_TRANSACTIONS_AND_TAX',
      );
      expect(taxRetention).toBeDefined();
      expect(taxRetention?.retentionPeriod).toContain('8 years');
      expect(taxRetention?.statutoryBasis).toContain('Companies Act');

      const safetyRetention = receipt.mandatoryRetentionExceptions.find(
        (r) => r.category === 'TRANSPORT_SAFETY_AND_INCIDENT_AUDIT',
      );
      expect(safetyRetention).toBeDefined();
      expect(safetyRetention?.retentionPeriod).toContain('3 years');
      expect(safetyRetention?.statutoryBasis).toContain('Motor Vehicles Act');

      // 3. Verify side effects
      expect(mockSavedLocationRepo.delete).toHaveBeenCalledWith({ userId: riderA.id });
      expect(mockSessionRepo.update).toHaveBeenCalledWith(
        { userId: riderA.id },
        { isRevoked: true },
      );
      expect(mockConsentRepo.update).toHaveBeenCalledWith(
        { userId: riderA.id },
        expect.objectContaining({ isGranted: false }),
      );
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
          name: 'DELETED_COMMUTER',
          phone: expect.stringContaining('del_'),
        }),
      );

      // 4. Verify audit event
      expect(mockAuditEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DATA_DELETION_PROCESSED',
          status: 'SUCCESS',
        }),
      );
    });

    it('should block Rider A from deleting Rider B account with 403 Forbidden', async () => {
      await expect(
        service.createDeletionRequest(riderA, riderB.id, {
          reason: 'Unauthorized attempt',
          confirmUnderstandRetention: true,
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockAuditEventRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CROSS_ACCOUNT_ACCESS_DENIED' }),
      );
    });
  });
});
