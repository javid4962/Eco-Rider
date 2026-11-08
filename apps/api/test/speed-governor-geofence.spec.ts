import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SpeedGovernorGeofenceService } from '../src/modules/speed-governor-geofence/speed-governor-geofence.service';
import { SpeedGovernorGeofenceController } from '../src/modules/speed-governor-geofence/speed-governor-geofence.controller';
import { SpeedGovernorGeofenceLogEntity } from '../src/database/entities/speed-governor-geofence-log.entity';
import { UrbanZoneType } from '@ecoride/contracts';

describe('SpeedGovernorGeofenceModule', () => {
  let service: SpeedGovernorGeofenceService;
  let controller: SpeedGovernorGeofenceController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-speed-gov-uuid',
      loggedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-speed-gov-uuid') {
        return {
          id: 'mock-speed-gov-uuid',
          isViolation: true,
          throttleLimitPercent: 40.0,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpeedGovernorGeofenceController],
      providers: [
        SpeedGovernorGeofenceService,
        {
          provide: getRepositoryToken(SpeedGovernorGeofenceLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<SpeedGovernorGeofenceService>(SpeedGovernorGeofenceService);
    controller = module.get<SpeedGovernorGeofenceController>(SpeedGovernorGeofenceController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should detect speed violation and trigger 40% throttle limit when speeding inside temple pedestrian zone', async () => {
    const log = await controller.check({
      vehicleId: 'EV-AUTO-BZA-4401',
      latitude: 16.518,
      longitude: 80.619,
      currentSpeedKmph: 28.5, // Exceeds 20 km/h temple zone limit
      zoneType: UrbanZoneType.TEMPLE_PEDESTRIAN_ZONE,
    });

    expect(log.zoneType).toBe(UrbanZoneType.TEMPLE_PEDESTRIAN_ZONE);
    expect(log.mandatedSpeedLimitKmph).toBe(20.0);
    expect(log.isViolation).toBe(true);
    expect(log.throttleLimitPercent).toBe(40.0);
    expect(log.hapticWarningIssued).toBe(true);
  });

  it('should permit full 100% throttle when vehicle complies with school hospital zone limit', async () => {
    const log = await controller.check({
      vehicleId: 'EV-AUTO-BZA-4401',
      latitude: 16.505,
      longitude: 80.648,
      currentSpeedKmph: 22.0, // Under 25 km/h limit
      zoneType: UrbanZoneType.SCHOOL_HOSPITAL_ZONE,
    });

    expect(log.zoneType).toBe(UrbanZoneType.SCHOOL_HOSPITAL_ZONE);
    expect(log.mandatedSpeedLimitKmph).toBe(25.0);
    expect(log.isViolation).toBe(false);
    expect(log.throttleLimitPercent).toBe(100.0);
    expect(log.hapticWarningIssued).toBe(false);
  });
});

