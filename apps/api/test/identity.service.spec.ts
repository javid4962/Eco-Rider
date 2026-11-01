import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { IdentityService } from '../src/modules/identity/identity.service';
import {
  User,
  Role,
  RiderProfile,
  DriverProfile,
  Session,
  Consent,
  AuditEvent,
  SavedLocation,
} from '../src/database/entities';
import { PlatformRole, ROLE_SCOPES } from '@ecoride/contracts';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('IdentityService & Role Scopes (EV-015)', () => {
  let service: IdentityService;
  let mockUserRepo: Partial<Repository<User>>;
  let mockRoleRepo: Partial<Repository<Role>>;
  let mockRiderProfileRepo: Partial<Repository<RiderProfile>>;
  let mockDriverProfileRepo: Partial<Repository<DriverProfile>>;
  let mockSessionRepo: Partial<Repository<Session>>;
  let mockConsentRepo: Partial<Repository<Consent>>;
  let mockAuditEventRepo: Partial<Repository<AuditEvent>>;
  let mockSavedLocationRepo: Partial<Repository<SavedLocation>>;
  let mockDataSource: Partial<DataSource>;

  let auditEventsList: Partial<AuditEvent>[] = [];

  const riderA: CurrentActorPayload = {
    id: 'a0000001-0000-0000-0000-000000000001',
    role: PlatformRole.RIDER,
    scopes: ROLE_SCOPES[PlatformRole.RIDER],
    ipAddress: '127.0.0.1',
    correlationId: 'corr-rider-a',
  };

  const riderB: CurrentActorPayload = {
    id: 'a0000001-0000-0000-0000-000000000002',
    role: PlatformRole.RIDER,
    scopes: ROLE_SCOPES[PlatformRole.RIDER],
    ipAddress: '127.0.0.1',
    correlationId: 'corr-rider-b',
  };

  const supportAgent: CurrentActorPayload = {
    id: 'c0000001-0000-0000-0000-000000000071',
    role: PlatformRole.SUPPORT,
    scopes: ROLE_SCOPES[PlatformRole.SUPPORT],
    ipAddress: '10.0.0.1',
    correlationId: 'corr-support',
  };

  const superAdmin: CurrentActorPayload = {
    id: 'c0000001-0000-0000-0000-000000000099',
    role: PlatformRole.SUPER_ADMIN,
    scopes: ROLE_SCOPES[PlatformRole.SUPER_ADMIN],
    ipAddress: '10.0.0.2',
    correlationId: 'corr-admin',
  };

  beforeEach(async () => {
    auditEventsList = [];

    mockAuditEventRepo = {
      create: jest.fn().mockImplementation((dto) => dto as AuditEvent),
      save: jest.fn().mockImplementation(async (event) => {
        const saved = { ...event, id: 'audit-uuid-' + (auditEventsList.length + 1) };
        auditEventsList.push(saved);
        return saved;
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockImplementation(async () => auditEventsList),
      }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
        if (id === riderA.id) {
          return {
            id: riderA.id,
            phone: '+919123400001',
            role: PlatformRole.RIDER,
            name: 'Kavya Sharma',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            riderProfile: {
              id: 'prof-1',
              userId: riderA.id,
              emergencyContactName: 'Ramesh Sharma',
              emergencyContactPhone: '+919123499999',
              preferredPaymentMode: 'UPI',
              accessibilityNeeds: false,
            },
          } as unknown as User;
        }
        if (id === riderB.id) {
          return {
            id: riderB.id,
            phone: '+919123400002',
            role: PlatformRole.RIDER,
            name: 'Ravi Teja',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as unknown as User;
        }
        return null;
      }),
      save: jest.fn().mockImplementation(async (u) => u),
    };

    mockRoleRepo = {
      find: jest.fn().mockResolvedValue([
        { id: 'RIDER', name: 'Rider', scopes: ROLE_SCOPES.RIDER },
        { id: 'SUPPORT', name: 'Support', scopes: ROLE_SCOPES.SUPPORT },
        { id: 'FINANCE', name: 'Finance', scopes: ROLE_SCOPES.FINANCE },
        { id: 'FLEET', name: 'Fleet', scopes: ROLE_SCOPES.FLEET },
        { id: 'OPERATOR', name: 'Operator', scopes: ROLE_SCOPES.OPERATOR },
        { id: 'SUPER_ADMIN', name: 'Super Admin', scopes: ['*'] },
      ]),
    };

    mockRiderProfileRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => dto as RiderProfile),
      save: jest.fn().mockImplementation(async (dto) => ({ id: 'new-prof-uuid', ...dto })),
    };

    mockDriverProfileRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'driver-prof-1',
        userId: 'b0000001-0000-0000-0000-000000000011',
        licenseNumber: 'AP-31-DL-2024-001',
        city: 'visakhapatnam',
      }),
      save: jest.fn().mockImplementation(async (dto) => dto),
    };

    mockSessionRepo = {
      create: jest.fn().mockImplementation((dto) => dto as Session),
      save: jest.fn().mockImplementation(async (dto) => ({ id: 'session-uuid', ...dto })),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({
        id: 'session-123',
        userId: riderA.id,
        isRevoked: false,
      }),
    };

    mockConsentRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => dto as Consent),
      save: jest.fn().mockImplementation(async (dto) => ({ id: 'consent-uuid', ...dto })),
      find: jest.fn().mockResolvedValue([]),
    };

    mockSavedLocationRepo = {
      count: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => dto as SavedLocation),
      save: jest.fn().mockImplementation(async (dto) => ({ id: 'loc-uuid', ...dto })),
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          findOne: jest.fn().mockImplementation(async (_entity, { where: { id } }) => {
            if (id === riderA.id) {
              return {
                id: riderA.id,
                role: PlatformRole.RIDER,
                updatedAt: new Date(),
              };
            }
            return null;
          }),
          save: jest.fn().mockImplementation(async (_entity, item) => item),
          create: jest.fn().mockImplementation((_entity, item) => item),
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        { provide: getRepositoryToken(RiderProfile), useValue: mockRiderProfileRepo },
        { provide: getRepositoryToken(DriverProfile), useValue: mockDriverProfileRepo },
        { provide: getRepositoryToken(Session), useValue: mockSessionRepo },
        { provide: getRepositoryToken(Consent), useValue: mockConsentRepo },
        { provide: getRepositoryToken(AuditEvent), useValue: mockAuditEventRepo },
        { provide: getRepositoryToken(SavedLocation), useValue: mockSavedLocationRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
  });

  describe('Ownership Rules & Cross-Account Authorization Enforcement', () => {
    it('should allow user to read their own profile (self-ownership)', async () => {
      const profile = await service.getUserProfile(riderA, riderA.id);
      expect(profile).toBeDefined();
      expect(profile.id).toBe(riderA.id);
      expect(profile.name).toBe('Kavya Sharma');
    });

    it('DEMONSTRATE ACCEPTANCE: should REJECT cross-account data access and log security audit event', async () => {
      // Rider A attempts to access Rider B's private account data
      await expect(service.getUserProfile(riderA, riderB.id)).rejects.toThrow(ForbiddenException);

      // Verify authoritative security audit event logged
      expect(auditEventsList.length).toBe(1);
      const denialAudit = auditEventsList[0];
      expect(denialAudit.action).toBe('CROSS_ACCOUNT_ACCESS_DENIED');
      expect(denialAudit.status).toBe('DENIED');
      expect(denialAudit.actorId).toBe(riderA.id);
      expect(denialAudit.targetUserId).toBe(riderB.id);
      expect(denialAudit.failureReason).toContain('Unauthorized cross-account access');
    });

    it('should allow SUPPORT role to read user profile under authorized operational scope', async () => {
      // Support agent has 'rider:read' scope
      const profile = await service.getUserProfile(supportAgent, riderA.id);
      expect(profile).toBeDefined();
      expect(profile.id).toBe(riderA.id);
    });

    it('should allow SUPER_ADMIN full administrative access to any user profile', async () => {
      const profile = await service.getUserProfile(superAdmin, riderB.id);
      expect(profile).toBeDefined();
      expect(profile.id).toBe(riderB.id);
    });
  });

  describe('Role Governance & Role Change Audit Trail', () => {
    it('DEMONSTRATE ACCEPTANCE: should reject role modification by non-admin and log denial audit', async () => {
      // Rider A tries to promote themselves to SUPER_ADMIN
      await expect(
        service.changeUserRole(riderA, riderA.id, PlatformRole.SUPER_ADMIN, 'Self escalation'),
      ).rejects.toThrow(ForbiddenException);

      expect(auditEventsList.length).toBe(1);
      const audit = auditEventsList[0];
      expect(audit.action).toBe('ROLE_CHANGE_DENIED');
      expect(audit.status).toBe('DENIED');
      expect(audit.actorId).toBe(riderA.id);
      expect(audit.targetUserId).toBe(riderA.id);
    });

    it('DEMONSTRATE ACCEPTANCE: should allow SUPER_ADMIN to change role and record full audit trail', async () => {
      const result = await service.changeUserRole(
        superAdmin,
        riderA.id,
        PlatformRole.SUPPORT,
        'Promotion to customer support specialist',
      );

      expect(result.userId).toBe(riderA.id);
      expect(result.previousRole).toBe(PlatformRole.RIDER);
      expect(result.newRole).toBe(PlatformRole.SUPPORT);
      expect(result.reason).toBe('Promotion to customer support specialist');
    });

    it('should reject invalid role assignments', async () => {
      await expect(
        service.changeUserRole(superAdmin, riderA.id, 'INVALID_ROLE_XYZ', 'test'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Rider & Driver Profile Management', () => {
    it('should create and update rider profile with accessibility needs', async () => {
      const profile = await service.updateRiderProfile(riderA, riderA.id, {
        emergencyContactName: 'Anand Sharma',
        emergencyContactPhone: '+919123488888',
        accessibilityNeeds: true,
        defaultPickupNotes: 'Waiting near main entrance ramp',
      });

      expect(profile.accessibilityNeeds).toBe(true);
      expect(profile.emergencyContactName).toBe('Anand Sharma');
      expect(auditEventsList.some((e) => e.action === 'RIDER_PROFILE_CREATED')).toBe(true);
    });

    it('should update driver badge and city', async () => {
      const driverActor: CurrentActorPayload = {
        id: 'b0000001-0000-0000-0000-000000000011',
        role: PlatformRole.CAPTAIN,
        scopes: ROLE_SCOPES[PlatformRole.CAPTAIN],
      };

      const updated = await service.updateDriverProfile(driverActor, driverActor.id, {
        badgeNumber: 'AP-VIZAG-EV-884',
        city: 'visakhapatnam',
      });

      expect(updated.badgeNumber).toBe('AP-VIZAG-EV-884');
      expect(auditEventsList.some((e) => e.action === 'DRIVER_PROFILE_UPDATED')).toBe(true);
    });
  });

  describe('Session & Consent Governance', () => {
    it('should generate secure session with hashed token and 30-day expiration', async () => {
      const result = await service.createSession(
        riderA.id,
        'RIDER_APP',
        'device-fingerprint-001',
        '127.0.0.1',
      );

      expect(result.rawToken).toHaveLength(64);
      expect(result.session.tokenHash).toHaveLength(64);
      expect(result.session.platform).toBe('RIDER_APP');
    });

    it('should revoke session and record audit event', async () => {
      const res = await service.revokeSession(riderA, riderA.id, 'session-123');
      expect(res.success).toBe(true);
      expect(res.isRevoked).toBe(true);
      expect(auditEventsList.some((e) => e.action === 'SESSION_REVOKED')).toBe(true);
    });

    it('should record user privacy consent and log audit event', async () => {
      const consent = await service.recordConsent(
        riderA,
        riderA.id,
        'PRIVACY_POLICY',
        'v1.0.0',
        true,
      );

      expect(consent.consentType).toBe('PRIVACY_POLICY');
      expect(consent.isGranted).toBe(true);
      expect(auditEventsList.some((e) => e.action === 'CONSENT_GRANTED')).toBe(true);
    });
  });

  describe('Role Scopes Verification', () => {
    it('should verify defined role scopes for support, finance, fleet, operator and super-admin', () => {
      // Support scope
      expect(ROLE_SCOPES[PlatformRole.SUPPORT]).toContain('rider:read');
      expect(ROLE_SCOPES[PlatformRole.SUPPORT]).toContain('driver:read');
      expect(ROLE_SCOPES[PlatformRole.SUPPORT]).not.toContain('finance:write');

      // Finance scope
      expect(ROLE_SCOPES[PlatformRole.FINANCE]).toContain('finance:read');
      expect(ROLE_SCOPES[PlatformRole.FINANCE]).toContain('finance:write');
      expect(ROLE_SCOPES[PlatformRole.FINANCE]).toContain('ledger:read');

      // Fleet scope
      expect(ROLE_SCOPES[PlatformRole.FLEET]).toContain('fleet:read');
      expect(ROLE_SCOPES[PlatformRole.FLEET]).toContain('vehicle:manage');
      expect(ROLE_SCOPES[PlatformRole.FLEET]).toContain('telemetry:read');

      // Operator scope
      expect(ROLE_SCOPES[PlatformRole.OPERATOR]).toContain('dispatch:manage');
      expect(ROLE_SCOPES[PlatformRole.OPERATOR]).toContain('zone:manage');
      expect(ROLE_SCOPES[PlatformRole.OPERATOR]).toContain('service:toggle');

      // Super admin scope
      expect(ROLE_SCOPES[PlatformRole.SUPER_ADMIN]).toContain('*');
    });
  });
});
