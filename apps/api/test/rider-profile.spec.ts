import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { PlatformRole, ROLE_SCOPES, SavedAddressType } from '@ecoride/contracts';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('Rider Profile & Saved Locations Unit Tests (EV-019)', () => {
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
  let savedLocationsList: SavedLocation[] = [];

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

  beforeEach(async () => {
    auditEventsList = [];
    savedLocationsList = [];

    mockAuditEventRepo = {
      create: jest.fn().mockImplementation((dto) => dto as AuditEvent),
      save: jest.fn().mockImplementation(async (event) => {
        const saved = { ...event, id: 'audit-uuid-' + (auditEventsList.length + 1) };
        auditEventsList.push(saved);
        return saved;
      }),
    };

    const userA = {
      id: riderA.id,
      phone: '+919123400001',
      role: PlatformRole.RIDER,
      name: 'Kavya Sharma',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    const userB = {
      id: riderB.id,
      phone: '+919123400002',
      role: PlatformRole.RIDER,
      name: 'Ravi Teja',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;

    mockUserRepo = {
      findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
        if (id === riderA.id) return userA;
        if (id === riderB.id) return userB;
        return null;
      }),
      save: jest.fn().mockImplementation(async (user) => user),
    };

    const existingRiderProfile = {
      id: 'prof-uuid-1',
      userId: riderA.id,
      preferredLanguage: 'te',
      emergencyContactName: 'Anand Sharma',
      emergencyContactPhone: '+919123499999',
      preferredPaymentMode: 'UPI',
      defaultPickupNotes: 'Near main gate',
      accessibilityNeeds: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RiderProfile;

    mockRiderProfileRepo = {
      findOne: jest.fn().mockImplementation(async ({ where: { userId } }) => {
        if (userId === riderA.id) return { ...existingRiderProfile };
        return null;
      }),
      create: jest.fn().mockImplementation(
        (dto) =>
          ({
            id: 'new-profile-uuid',
            ...dto,
          }) as RiderProfile,
      ),
      save: jest.fn().mockImplementation(async (dto) => ({ ...dto, updatedAt: new Date() })),
    };

    mockSavedLocationRepo = {
      count: jest.fn().mockImplementation(async ({ where: { userId } }) => {
        return savedLocationsList.filter((l) => l.userId === userId).length;
      }),
      create: jest.fn().mockImplementation((dto) => {
        const loc = new SavedLocation();
        Object.assign(loc, {
          id: 'loc-' + (savedLocationsList.length + 1),
          createdAt: new Date(),
          updatedAt: new Date(),
          ...dto,
        });
        return loc;
      }),
      save: jest.fn().mockImplementation(async (loc: SavedLocation) => {
        const idx = savedLocationsList.findIndex((l) => l.id === loc.id);
        if (idx >= 0) {
          savedLocationsList[idx] = { ...loc, updatedAt: new Date() };
          return savedLocationsList[idx];
        } else {
          savedLocationsList.push(loc);
          return loc;
        }
      }),
      findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
        return savedLocationsList.find((l) => l.id === id) || null;
      }),
      remove: jest.fn().mockImplementation(async (loc: SavedLocation) => {
        const idx = savedLocationsList.findIndex((l) => l.id === loc.id);
        if (idx >= 0) {
          savedLocationsList.splice(idx, 1);
        }
        return loc;
      }),
      createQueryBuilder: jest.fn().mockImplementation(() => {
        let filterUserId: string | undefined;
        let filterTypes: string[] | undefined;
        let skipCount = 0;
        let takeCount = 10;

        const builder = {
          where: jest.fn().mockImplementation((_query, params) => {
            filterUserId = params?.userId;
            return builder;
          }),
          andWhere: jest.fn().mockImplementation((_query, params) => {
            filterTypes = params?.types;
            return builder;
          }),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockImplementation((n) => {
            skipCount = n;
            return builder;
          }),
          take: jest.fn().mockImplementation((n) => {
            takeCount = n;
            return builder;
          }),
          getManyAndCount: jest.fn().mockImplementation(async () => {
            let filtered = savedLocationsList.filter((l) => l.userId === filterUserId);
            if (filterTypes && filterTypes.length > 0) {
              filtered = filtered.filter((l) => filterTypes!.includes(l.addressType));
            }
            const paginated = filtered.slice(skipCount, skipCount + takeCount);
            return [paginated, filtered.length];
          }),
        };
        return builder;
      }),
    };

    mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    mockRoleRepo = {};
    mockDriverProfileRepo = {};
    mockSessionRepo = {};
    mockConsentRepo = {};

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

  describe('1. Rider Profile & Language Management', () => {
    it('should update rider chosen language to Telugu (te) and update display name', async () => {
      const updated = await service.updateRiderProfile(riderA, riderA.id, {
        name: 'Kavya S. (Visakhapatnam)',
        preferredLanguage: 'te',
        emergencyContactName: 'Anand Sharma',
        emergencyContactPhone: '+919123499999',
        preferredPaymentMode: 'UPI',
        accessibilityNeeds: true,
      });

      expect(updated.preferredLanguage).toBe('te');
      expect(updated.accessibilityNeeds).toBe(true);
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(auditEventsList.some((e) => e.action === 'RIDER_PROFILE_UPDATED')).toBe(true);
    });

    it('should update rider chosen language to English (en)', async () => {
      const updated = await service.updateRiderProfile(riderA, riderA.id, {
        preferredLanguage: 'en',
      });

      expect(updated.preferredLanguage).toBe('en');
    });

    it('should update rider chosen language to Hindi (hi)', async () => {
      const updated = await service.updateRiderProfile(riderA, riderA.id, {
        preferredLanguage: 'hi',
      });

      expect(updated.preferredLanguage).toBe('hi');
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A cannot update Rider B profile (403 Forbidden)', async () => {
      await expect(
        service.updateRiderProfile(riderA, riderB.id, {
          emergencyContactName: 'Hacker Name',
        }),
      ).rejects.toThrow(ForbiddenException);

      const deniedAudit = auditEventsList.find((e) => e.action === 'CROSS_ACCOUNT_ACCESS_DENIED');
      expect(deniedAudit).toBeDefined();
      expect(deniedAudit?.actorId).toBe(riderA.id);
      expect(deniedAudit?.targetUserId).toBe(riderB.id);
    });
  });

  describe('2. Saved Pickup/Drop Locations Creation & Input Limits', () => {
    it('should successfully create a saved pickup location with PostGIS coordinates', async () => {
      const loc = await service.createSavedLocation(riderA, riderA.id, {
        label: 'Home',
        addressType: SavedAddressType.PICKUP,
        addressLine: 'Flat 402, Sea Breeze Apartments, Beach Road',
        landmark: 'Near Kali Temple',
        latitude: 17.7126,
        longitude: 83.3182,
      });

      expect(loc).toBeDefined();
      expect(loc.userId).toBe(riderA.id);
      expect(loc.label).toBe('Home');
      expect(loc.addressType).toBe(SavedAddressType.PICKUP);
      expect(loc.latitude).toBe(17.7126);
      expect(loc.longitude).toBe(83.3182);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('ST_SetSRID(ST_MakePoint'),
        [83.3182, 17.7126, loc.id],
      );
      expect(auditEventsList.some((e) => e.action === 'SAVED_LOCATION_CREATED')).toBe(true);
    });

    it('should successfully create a saved drop location (Work)', async () => {
      const loc = await service.createSavedLocation(riderA, riderA.id, {
        label: 'Tech Hub Office',
        addressType: SavedAddressType.DROP,
        addressLine: 'Plot 14, IT SEZ, Madhurawada',
        landmark: 'Opposite Cricket Stadium',
        latitude: 17.7984,
        longitude: 83.3524,
      });

      expect(loc.addressType).toBe(SavedAddressType.DROP);
      expect(loc.label).toBe('Tech Hub Office');
    });

    it('DEMONSTRATE ACCEPTANCE: Enforce input limit of maximum 20 saved locations per rider', async () => {
      // Seed 20 locations for riderA
      for (let i = 1; i <= 20; i++) {
        savedLocationsList.push({
          id: `loc-seed-${i}`,
          userId: riderA.id,
          label: `Saved Location ${i}`,
          addressType: 'BOTH',
          addressLine: `Street ${i}, Visakhapatnam`,
          latitude: 17.7 + i * 0.001,
          longitude: 83.3 + i * 0.001,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as SavedLocation);
      }

      // Attempting to create the 21st location must fail with 400 Bad Request
      await expect(
        service.createSavedLocation(riderA, riderA.id, {
          label: '21st Location Over Limit',
          addressType: SavedAddressType.BOTH,
          addressLine: 'Gajuwaka Junction, Visakhapatnam',
          latitude: 17.6904,
          longitude: 83.2091,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Saved Locations Pagination & Filtering', () => {
    beforeEach(() => {
      // Seed 15 saved locations for rider A
      for (let i = 1; i <= 15; i++) {
        savedLocationsList.push({
          id: `loc-page-${i}`,
          userId: riderA.id,
          label: `Location ${i}`,
          addressType: i % 2 === 0 ? 'PICKUP' : 'DROP',
          addressLine: `Address ${i}, MVP Colony`,
          latitude: 17.72 + i * 0.001,
          longitude: 83.33 + i * 0.001,
          createdAt: new Date(Date.now() - i * 1000),
          updatedAt: new Date(Date.now() - i * 1000),
        } as SavedLocation);
      }
    });

    it('DEMONSTRATE ACCEPTANCE: should return paginated saved locations (page 1, limit 10)', async () => {
      const res = await service.getSavedLocations(riderA, riderA.id, { page: 1, limit: 10 });

      expect(res.total).toBe(15);
      expect(res.items.length).toBe(10);
      expect(res.page).toBe(1);
      expect(res.limit).toBe(10);
      expect(res.totalPages).toBe(2);
    });

    it('DEMONSTRATE ACCEPTANCE: should return second page (page 2, limit 10)', async () => {
      const res = await service.getSavedLocations(riderA, riderA.id, { page: 2, limit: 10 });

      expect(res.total).toBe(15);
      expect(res.items.length).toBe(5);
      expect(res.page).toBe(2);
    });

    it('should filter saved locations by type PICKUP', async () => {
      const res = await service.getSavedLocations(riderA, riderA.id, {
        type: SavedAddressType.PICKUP,
      });

      expect(res.items.every((l) => l.addressType === 'PICKUP' || l.addressType === 'BOTH')).toBe(
        true,
      );
    });
  });

  describe('4. Row Ownership Enforcement on Saved Locations', () => {
    let riderBLocation: SavedLocation;

    beforeEach(() => {
      riderBLocation = {
        id: 'loc-rider-b-secret',
        userId: riderB.id,
        label: 'Rider B Private Home',
        addressType: 'BOTH',
        addressLine: 'Secret Villa, Siripuram',
        latitude: 17.7201,
        longitude: 83.3155,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SavedLocation;

      savedLocationsList.push(riderBLocation);
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A cannot list Rider B saved locations (403 Forbidden)', async () => {
      await expect(
        service.getSavedLocations(riderA, riderB.id, { page: 1, limit: 10 }),
      ).rejects.toThrow(ForbiddenException);

      expect(auditEventsList.some((e) => e.action === 'CROSS_ACCOUNT_ACCESS_DENIED')).toBe(true);
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A cannot retrieve Rider B saved location by ID', async () => {
      // 1. Through Rider B's URL path: fails with 403 Forbidden
      await expect(
        service.getSavedLocationById(riderA, riderB.id, riderBLocation.id),
      ).rejects.toThrow(ForbiddenException);

      // 2. Through Rider A's URL path with Rider B's location ID: fails with 404 NotFound
      await expect(
        service.getSavedLocationById(riderA, riderA.id, riderBLocation.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A cannot update Rider B saved location', async () => {
      await expect(
        service.updateSavedLocation(riderA, riderB.id, riderBLocation.id, {
          label: 'Hacked Label',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(riderBLocation.label).toBe('Rider B Private Home');
    });

    it('DEMONSTRATE ACCEPTANCE: Rider A cannot delete Rider B saved location', async () => {
      await expect(
        service.deleteSavedLocation(riderA, riderB.id, riderBLocation.id),
      ).rejects.toThrow(ForbiddenException);

      expect(savedLocationsList.some((l) => l.id === riderBLocation.id)).toBe(true);
    });

    it('SUPPORT agent can view Rider B saved locations under support operational scope', async () => {
      const res = await service.getSavedLocations(supportAgent, riderB.id, { page: 1, limit: 10 });
      expect(res.total).toBe(1);
      expect(res.items[0].id).toBe(riderBLocation.id);
    });
  });

  describe('5. Update and Delete Saved Locations Workflow', () => {
    let riderALocation: SavedLocation;

    beforeEach(() => {
      riderALocation = {
        id: 'loc-rider-a-test',
        userId: riderA.id,
        label: 'Old Gym Label',
        addressType: 'BOTH',
        addressLine: 'Old Street 5',
        latitude: 17.71,
        longitude: 83.31,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SavedLocation;

      savedLocationsList.push(riderALocation);
    });

    it('should update saved location fields and log SAVED_LOCATION_UPDATED audit', async () => {
      const updated = await service.updateSavedLocation(riderA, riderA.id, riderALocation.id, {
        label: 'Gold Fitness Gym',
        addressLine: 'New Complex, VIP Road',
        landmark: 'Next to Central Mall',
        latitude: 17.7255,
        longitude: 83.3199,
      });

      expect(updated.label).toBe('Gold Fitness Gym');
      expect(updated.addressLine).toBe('New Complex, VIP Road');
      expect(updated.landmark).toBe('Next to Central Mall');
      expect(updated.latitude).toBe(17.7255);
      expect(updated.longitude).toBe(83.3199);
      expect(auditEventsList.some((e) => e.action === 'SAVED_LOCATION_UPDATED')).toBe(true);
    });

    it('should delete saved location and log SAVED_LOCATION_DELETED audit', async () => {
      const res = await service.deleteSavedLocation(riderA, riderA.id, riderALocation.id);

      expect(res.success).toBe(true);
      expect(res.id).toBe(riderALocation.id);
      expect(savedLocationsList.some((l) => l.id === riderALocation.id)).toBe(false);
      expect(auditEventsList.some((e) => e.action === 'SAVED_LOCATION_DELETED')).toBe(true);
    });

    it('should fail with 404 when deleting a non-existent saved location', async () => {
      await expect(
        service.deleteSavedLocation(riderA, riderA.id, 'non-existent-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
