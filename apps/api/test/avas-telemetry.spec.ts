import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvasTelemetryService } from '../src/modules/avas-telemetry/avas-telemetry.service';
import { AvasSoundTelemetry } from '../src/database/entities/avas-sound-telemetry.entity';
import { AvasSoundStatus } from '@ecoride/contracts';

describe('AvasTelemetryService (M84)', () => {
  let service: AvasTelemetryService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'avas-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (t) => ({ ...t })),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvasTelemetryService,
        {
          provide: getRepositoryToken(AvasSoundTelemetry),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AvasTelemetryService>(AvasTelemetryService);
  });

  it('should mark SPEED_ABOVE_THRESHOLD as compliant when speed >= 20 km/h', async () => {
    const result = await service.processTelemetry({
      vehicleId: 'veh-ev-01',
      speedKmph: 32.5,
      acousticChimeDb: 0,
      isChimeEnabled: false,
      latitude: 16.506,
      longitude: 80.648,
      isPedestrianZone: false,
      timestamp: new Date().toISOString(),
    });

    expect(result.status).toBe(AvasSoundStatus.SPEED_ABOVE_THRESHOLD);
    expect(result.isCompliant).toBe(true);
    expect(result.penaltyPaise).toBe(0);
  });

  it('should verify CHIME_ACTIVE compliance when speed < 20 km/h and chime >= 56 dB', async () => {
    const result = await service.processTelemetry({
      vehicleId: 'veh-ev-02',
      speedKmph: 12.0,
      acousticChimeDb: 62.0,
      isChimeEnabled: true,
      latitude: 16.512,
      longitude: 80.623,
      isPedestrianZone: false,
      timestamp: new Date().toISOString(),
    });

    expect(result.status).toBe(AvasSoundStatus.CHIME_ACTIVE);
    expect(result.isCompliant).toBe(true);
    expect(result.pedestrianSafetyRisk).toBe(false);
  });

  it('should flag INFRACTION_MUTED and levy ₹500 penalty if chime muted in pedestrian zone', async () => {
    const result = await service.processTelemetry({
      vehicleId: 'veh-ev-03',
      speedKmph: 8.5,
      acousticChimeDb: 35.0, // Silent/below threshold
      isChimeEnabled: false,
      latitude: 16.516,
      longitude: 80.631,
      isPedestrianZone: true, // Besant Road pedestrian corridor
      timestamp: new Date().toISOString(),
    });

    expect(result.status).toBe(AvasSoundStatus.INFRACTION_MUTED);
    expect(result.isCompliant).toBe(false);
    expect(result.pedestrianSafetyRisk).toBe(true);
    expect(result.penaltyPaise).toBe(50000); // ₹500
  });
});

