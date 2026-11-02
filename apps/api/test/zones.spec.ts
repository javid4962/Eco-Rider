import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ZonesService } from '../src/modules/zones/zones.service';
import { Zone, ServiceCity } from '../src/database/entities';
import { IdentityService } from '../src/modules/identity/identity.service';
import {
  CityOperationalStatus,
  DEFAULT_DISABLED_CATEGORY_SWITCHES,
  GeoJsonPolygon,
  PlatformRole,
  ZoneOperationalStatus,
} from '@ecoride/contracts';
import { DataSource } from 'typeorm';
import { CurrentActorPayload } from '../src/modules/identity/current-actor.decorator';

describe('ZonesService & Geofence Verification Unit Tests (EV-031)', () => {
  let service: ZonesService;
  let zoneRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };
  let cityRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
  };
  let identityService: {
    recordAuditEvent: jest.Mock;
  };
  let dataSource: {
    query: jest.Mock;
  };

  const mockOperator: CurrentActorPayload = {
    id: 'op111111-1111-4000-8000-000000000001',
    role: PlatformRole.OPERATOR,
    scopes: ['zone:manage', 'zone:read'],
    ipAddress: '127.0.0.1',
    correlationId: 'trace-zones-test',
  };

  // Visakhapatnam Beach Road Polygon: (minLng: 83.20, maxLng: 83.35, minLat: 17.65, maxLat: 17.75)
  const vizagBeachPolygon: GeoJsonPolygon = {
    type: 'Polygon',
    coordinates: [
      [
        [83.2, 17.65],
        [83.35, 17.65],
        [83.35, 17.75],
        [83.2, 17.75],
        [83.2, 17.65], // closed ring
      ],
    ],
  };

  const futureYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const pastYesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  beforeEach(async () => {
    zoneRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'z1000000-0000-4000-8000-000000000001' })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'z1000000-0000-4000-8000-000000000001' }),
      ),
      count: jest.fn().mockResolvedValue(1),
    };

    cityRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'c1000000-0000-4000-8000-000000000001' })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'c1000000-0000-4000-8000-000000000001' }),
      ),
      count: jest.fn().mockResolvedValue(1),
    };

    identityService = {
      recordAuditEvent: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      query: jest.fn().mockRejectedValue(new Error('PostGIS socket not connected in unit test')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonesService,
        { provide: getRepositoryToken(Zone), useValue: zoneRepo },
        { provide: getRepositoryToken(ServiceCity), useValue: cityRepo },
        { provide: IdentityService, useValue: identityService },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ZonesService>(ZonesService);
  });

  describe('1. Default All Real Categories Disabled', () => {
    it('should have all real mobility categories disabled by default in contract definition', () => {
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.CITY_COMMUTE_2W).toBe(false);
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.AUTO_COMMUTE_3W).toBe(false);
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.CAB_PRIVATE_4W).toBe(false);
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.VAN_COMMUTE_4W).toBe(false);
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.private_ev).toBe(false);
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.scheduled_sharing).toBe(false);
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.commuter_pass).toBe(false);
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.on_time_guarantee).toBe(false);
      expect(DEFAULT_DISABLED_CATEGORY_SWITCHES.fleet_optimization).toBe(false);
    });

    it('should initialize a newly created service city with all real categories disabled by default', async () => {
      cityRepo.findOne.mockResolvedValue(null);

      const result = await service.createCity(mockOperator, {
        code: 'vijayawada',
        name: 'Vijayawada',
        centerLatitude: 16.5062,
        centerLongitude: 80.648,
      });

      expect(result.code).toBe('vijayawada');
      expect(result.operationalStatus).toBe(CityOperationalStatus.DISABLED);
      expect(result.categorySwitches.CITY_COMMUTE_2W).toBe(false);
      expect(result.categorySwitches.CAB_PRIVATE_4W).toBe(false);
      expect(result.categorySwitches.private_ev).toBe(false);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SERVICE_CITY_CREATED' }),
      );
    });

    it('should initialize a newly created polygonal zone with all real categories disabled by default', async () => {
      zoneRepo.findOne.mockResolvedValue(null);

      const result = await service.createZone(mockOperator, {
        code: 'vzg_beach_corridor',
        name: 'Visakhapatnam Beach Road EV Corridor',
        city: 'visakhapatnam',
        boundary: vizagBeachPolygon,
      });

      expect(result.code).toBe('vzg_beach_corridor');
      expect(result.operationalStatus).toBe(ZoneOperationalStatus.DISABLED);
      expect(result.categorySwitches.CITY_COMMUTE_2W).toBe(false);
      expect(result.categorySwitches.CAB_PRIVATE_4W).toBe(false);
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ZONE_CREATED' }),
      );
    });
  });

  describe('2. Polygonal Geometry Validation', () => {
    it('should reject invalid GeoJSON boundary without a closed ring', async () => {
      zoneRepo.findOne.mockResolvedValue(null);

      const invalidPolygon: GeoJsonPolygon = {
        type: 'Polygon',
        coordinates: [
          [
            [83.2, 17.65],
            [83.35, 17.65],
            [83.35, 17.75],
            [83.2, 17.75],
            // Missing identical closing coordinate
            [83.19, 17.64],
          ],
        ],
      };

      await expect(
        service.createZone(mockOperator, {
          code: 'invalid_zone',
          name: 'Invalid Boundary Zone',
          city: 'visakhapatnam',
          boundary: invalidPolygon,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accurately compute ray-casting point-in-polygon math', () => {
      const ring = vizagBeachPolygon.coordinates[0];

      // Point inside (Beach Road center: 83.25, 17.70)
      expect(service.isPointInPolygon([83.25, 17.7], ring)).toBe(true);

      // Point outside (Far offshore or rural: 83.50, 17.70)
      expect(service.isPointInPolygon([83.5, 17.7], ring)).toBe(false);

      // Point outside north (17.90)
      expect(service.isPointInPolygon([83.25, 17.9], ring)).toBe(false);
    });
  });

  describe('3. Acceptance: Server-Side Authoritative Location & Category Verification', () => {
    const mockActiveZone: Partial<Zone> = {
      id: 'z1000000-0000-4000-8000-000000000001',
      code: 'vzg_beach_corridor',
      name: 'Visakhapatnam Beach Road EV Corridor',
      city: 'visakhapatnam',
      operationalStatus: ZoneOperationalStatus.ACTIVE,
      evidenceReference: 'AP-RTO-VZG-ZONE-01-2025',
      permitExpiresAt: futureYear,
      categorySwitches: {
        CITY_COMMUTE_2W: true, // Only 2W electric bike taxi enabled
        CAB_PRIVATE_4W: false, // 4W electric cab disabled
      },
      boundary: vizagBeachPolygon,
      isActive: true,
    };

    it('should authorize request inside geofence with enabled category switch and unexpired permit', async () => {
      zoneRepo.find.mockResolvedValue([mockActiveZone]);

      const result = await service.verifyLocation({
        city: 'visakhapatnam',
        latitude: 17.7,
        longitude: 83.25,
        serviceCategory: 'CITY_COMMUTE_2W',
      });

      expect(result.isAuthorized).toBe(true);
      expect(result.isInsideGeofence).toBe(true);
      expect(result.isPermitValid).toBe(true);
      expect(result.isCategoryEnabled).toBe(true);
      expect(result.zoneCode).toBe('vzg_beach_corridor');
    });

    it('should reject request outside approved polygonal service zones', async () => {
      zoneRepo.find.mockResolvedValue([mockActiveZone]);

      // Coordinates far outside Vizag Beach Road polygon (e.g. 83.80, 18.20)
      const result = await service.verifyLocation({
        city: 'visakhapatnam',
        latitude: 18.2,
        longitude: 83.8,
        serviceCategory: 'CITY_COMMUTE_2W',
      });

      expect(result.isAuthorized).toBe(false);
      expect(result.isInsideGeofence).toBe(false);
      expect(result.rejectionReason).toContain('outside authorized polygonal service zones');
    });

    it('should reject request inside geofence when category switch is disabled', async () => {
      zoneRepo.find.mockResolvedValue([mockActiveZone]);

      // CAB_PRIVATE_4W is false in mockActiveZone
      const result = await service.verifyLocation({
        city: 'visakhapatnam',
        latitude: 17.7,
        longitude: 83.25,
        serviceCategory: 'CAB_PRIVATE_4W',
      });

      expect(result.isAuthorized).toBe(false);
      expect(result.isInsideGeofence).toBe(true);
      expect(result.isCategoryEnabled).toBe(false);
      expect(result.rejectionReason).toContain(
        "Service category 'CAB_PRIVATE_4W' is disabled in zone",
      );
    });

    it('should REJECT even when client forges availability (clientForgedAvailability: true)', async () => {
      zoneRepo.find.mockResolvedValue([mockActiveZone]);

      // Client passes forged flag claiming CAB_PRIVATE_4W is available
      const result = await service.verifyLocation({
        city: 'visakhapatnam',
        latitude: 17.7,
        longitude: 83.25,
        serviceCategory: 'CAB_PRIVATE_4W',
        clientForgedAvailability: true, // Spoofed availability
      });

      // Server enforces database category switch and REJECTS
      expect(result.isAuthorized).toBe(false);
      expect(result.isInsideGeofence).toBe(true);
      expect(result.isCategoryEnabled).toBe(false);
      expect(result.rejectionReason).toContain(
        "Service category 'CAB_PRIVATE_4W' is disabled in zone",
      );
    });

    it('should reject request when statutory operating permit is expired', async () => {
      const expiredZone = {
        ...mockActiveZone,
        permitExpiresAt: pastYesterday, // Expired yesterday
      };
      zoneRepo.find.mockResolvedValue([expiredZone]);

      const result = await service.verifyLocation({
        city: 'visakhapatnam',
        latitude: 17.7,
        longitude: 83.25,
        serviceCategory: 'CITY_COMMUTE_2W',
      });

      expect(result.isAuthorized).toBe(false);
      expect(result.isInsideGeofence).toBe(true);
      expect(result.isPermitValid).toBe(false);
      expect(result.rejectionReason).toContain('Statutory operating permit for zone');
      expect(result.rejectionReason).toContain('expired');
    });

    it('should reject request when zone operational status is SUSPENDED or DISABLED', async () => {
      const suspendedZone = {
        ...mockActiveZone,
        operationalStatus: ZoneOperationalStatus.SUSPENDED,
      };
      zoneRepo.find.mockResolvedValue([suspendedZone]);

      const result = await service.verifyLocation({
        city: 'visakhapatnam',
        latitude: 17.7,
        longitude: 83.25,
        serviceCategory: 'CITY_COMMUTE_2W',
      });

      expect(result.isAuthorized).toBe(false);
      expect(result.isInsideGeofence).toBe(true);
      expect(result.rejectionReason).toContain('SUSPENDED');
    });
  });

  describe('4. Operator Category Switch Toggling & Auditing', () => {
    it('should allow operator to toggle category switch with statutory evidence reference', async () => {
      const zoneEntity = {
        id: 'z1000000-0000-4000-8000-000000000001',
        code: 'vzg_beach_corridor',
        name: 'Visakhapatnam Beach Road EV Corridor',
        city: 'visakhapatnam',
        operationalStatus: ZoneOperationalStatus.ACTIVE,
        evidenceReference: 'AP-RTO-VZG-INITIAL',
        categorySwitches: {
          CITY_COMMUTE_2W: false,
        },
        boundary: vizagBeachPolygon,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as Zone;

      zoneRepo.findOne.mockResolvedValue(zoneEntity);

      const result = await service.toggleCategorySwitch(mockOperator, zoneEntity.id, {
        serviceCategory: 'CITY_COMMUTE_2W',
        isEnabled: true,
        evidenceReference: 'AP-RTO-VZG-EV-GO-102-APPROVAL',
      });

      expect(result.categorySwitches.CITY_COMMUTE_2W).toBe(true);
      expect(result.evidenceReference).toBe('AP-RTO-VZG-EV-GO-102-APPROVAL');
      expect(identityService.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ZONE_CATEGORY_SWITCH_TOGGLED',
          entityType: 'ZONE',
          entityId: zoneEntity.id,
          previousState: { category: 'CITY_COMMUTE_2W', isEnabled: false },
          newState: {
            category: 'CITY_COMMUTE_2W',
            isEnabled: true,
            evidenceReference: 'AP-RTO-VZG-EV-GO-102-APPROVAL',
          },
        }),
      );
    });
  });
});
