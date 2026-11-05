import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SpeedGovernorService } from '../src/modules/speed-governor/speed-governor.service';
import { SpeedGovernorController } from '../src/modules/speed-governor/speed-governor.controller';
import { SpeedLimitZone } from '../src/database/entities/speed-limit-zone.entity';
import { SpeedViolationIncident } from '../src/database/entities/speed-violation-incident.entity';
import { SpeedZoneType } from '@ecoride/contracts';

describe('SpeedGovernorService (M54)', () => {
  let service: SpeedGovernorService;
  let mockZoneRepo: any;
  let mockIncidentRepo: any;

  beforeEach(async () => {
    mockZoneRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'zone-1',
          zoneCode: 'VJA_SCHOOL_ZONE_01',
          zoneName: 'MG Road Delhi Public School Zone',
          city: 'Vijayawada',
          zoneType: SpeedZoneType.SCHOOL_ZONE,
          maxSpeedKmph: 25,
          latitude: 16.502,
          longitude: 80.641,
          radiusMeters: 400,
        },
      ]),
      save: jest.fn((e) => Promise.resolve({ ...e })),
      create: jest.fn((e) => ({ ...e, id: 'zone-new' })),
    };

    mockIncidentRepo = {
      create: jest.fn((e) => ({ ...e, id: 'inc-123', recordedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpeedGovernorController],
      providers: [
        SpeedGovernorService,
        { provide: getRepositoryToken(SpeedLimitZone), useValue: mockZoneRepo },
        { provide: getRepositoryToken(SpeedViolationIncident), useValue: mockIncidentRepo },
      ],
    }).compile();

    service = module.get<SpeedGovernorService>(SpeedGovernorService);
  });

  it('should ignore speed telemetry within safe statutory limits', async () => {
    const incident = await service.processSpeedTelemetry({
      vehicleRegistrationNumber: 'AP16EV1234',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      latitude: 16.502,
      longitude: 80.641,
      speedKmph: 22.0, // <= 25 km/h
      recordedAt: new Date().toISOString(),
    });

    expect(incident).toBeNull();
    expect(mockIncidentRepo.save).not.toHaveBeenCalled();
  });

  it('should flag violation and emit bilingual warning when vehicle speeds in school zone', async () => {
    const incident = await service.processSpeedTelemetry({
      vehicleRegistrationNumber: 'AP16EV1234',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      latitude: 16.502,
      longitude: 80.641,
      speedKmph: 42.0, // > 25 km/h limit + 5km/h buffer
      recordedAt: new Date().toISOString(),
    });

    expect(incident).not.toBeNull();
    expect(incident?.zoneCode).toBe('VJA_SCHOOL_ZONE_01');
    expect(incident?.actualSpeedKmph).toBe(42);
    expect(incident?.excessSpeedKmph).toBe(17);
    expect(incident?.safetyScorePenalty).toBe(10);
    expect(incident?.warningNoticeTelugu).toContain('వేగ పరిమితి 25 km/h దాటినది');
  });
});

