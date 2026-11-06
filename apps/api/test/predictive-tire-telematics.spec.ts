import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PredictiveTireService } from '../src/modules/predictive-tire/predictive-tire.service';
import { PredictiveTireAssessment } from '../src/database/entities/predictive-tire-assessment.entity';
import { TireWearStatus } from '@ecoride/contracts';

describe('PredictiveTireService (M90)', () => {
  let service: PredictiveTireService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'tire-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (a) => ({ ...a })),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictiveTireService,
        {
          provide: getRepositoryToken(PredictiveTireAssessment),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PredictiveTireService>(PredictiveTireService);
  });

  it('should evaluate HEALTHY tire status when tread depths and pressures are nominal', async () => {
    const result = await service.assessTireTelemetry({
      vehicleId: 'veh-ev-01',
      odometerKm: 12000,
      tirePressurePsiFrontLeft: 34,
      tirePressurePsiFrontRight: 34,
      tirePressurePsiRearLeft: 36,
      tirePressurePsiRearRight: 36,
      treadDepthMmFront: 6.5,
      treadDepthMmRear: 6.8,
      rapidAccelerationCount: 4,
      regenerativeBrakingHardCount: 2,
      ambientRoadTempCelsius: 38.0,
    });

    expect(result.tireWearStatus).toBe(TireWearStatus.HEALTHY);
    expect(result.immediateDepotServiceRequired).toBe(false);
    expect(result.workOrderCreated).toBe(false);
  });

  it('should flag CRITICAL_REPLACEMENT_REQUIRED and auto-generate work order when tread is worn near 1.6 mm limit', async () => {
    const result = await service.assessTireTelemetry({
      vehicleId: 'veh-ev-worn-01',
      odometerKm: 58000,
      tirePressurePsiFrontLeft: 31,
      tirePressurePsiFrontRight: 30,
      tirePressurePsiRearLeft: 32,
      tirePressurePsiRearRight: 32,
      treadDepthMmFront: 1.8, // Critical (< 2.0 mm)
      treadDepthMmRear: 2.1,
      rapidAccelerationCount: 18,
      regenerativeBrakingHardCount: 22,
      ambientRoadTempCelsius: 44.5,
    });

    expect(result.tireWearStatus).toBe(TireWearStatus.CRITICAL_REPLACEMENT_REQUIRED);
    expect(result.immediateDepotServiceRequired).toBe(true);
    expect(result.workOrderCreated).toBe(true);
    expect(result.maintenanceWorkOrderRef).toMatch(/^WO-TIRE-/);
  });
});
