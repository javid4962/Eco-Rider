import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WheelAlignmentTelemetryService } from '../src/modules/wheel-alignment-telemetry/wheel-alignment-telemetry.service';
import { WheelAlignmentTelemetryController } from '../src/modules/wheel-alignment-telemetry/wheel-alignment-telemetry.controller';
import { WheelAlignmentLogEntity } from '../src/database/entities/wheel-alignment-log.entity';
import { AlignmentStatus } from '@ecoride/contracts';

describe('WheelAlignmentTelemetryModule', () => {
  let service: WheelAlignmentTelemetryService;
  let controller: WheelAlignmentTelemetryController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-align-uuid',
      loggedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-align-uuid') {
        return {
          id: 'mock-align-uuid',
          vehicleId: 'EV-CAB-AP37-1100',
          alignmentStatus: AlignmentStatus.CRITICAL_TIRE_SCRUB,
          depotMaintenanceRequired: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WheelAlignmentTelemetryController],
      providers: [
        WheelAlignmentTelemetryService,
        {
          provide: getRepositoryToken(WheelAlignmentLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<WheelAlignmentTelemetryService>(WheelAlignmentTelemetryService);
    controller = module.get<WheelAlignmentTelemetryController>(WheelAlignmentTelemetryController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should detect critical tire scrub and generate depot maintenance work order for high steering pull', async () => {
    const log = await controller.ingest({
      vehicleId: 'EV-CAB-AP37-1100',
      captainId: 'CAP-GUN-045',
      rollingWindowKm: 100.0,
      steeringAngleMeanOffsetDeg: 5.6, // Pull offset > 5.0 deg
      lateralDriftRateMps2: 1.4,
      yawRateVariance: 0.85,
    });

    expect(log.alignmentStatus).toBe(AlignmentStatus.CRITICAL_TIRE_SCRUB);
    expect(log.depotMaintenanceRequired).toBe(true);
    expect(log.maintenanceWorkOrderRef).toContain('WO-ALIGN-');
    expect(log.estimatedTireLifeReductionPercent).toBe(40.0);
  });

  it('should verify perfect wheel alignment when sensor offset is negligible', async () => {
    const log = await controller.ingest({
      vehicleId: 'EV-CAB-AP37-1101',
      captainId: 'CAP-GUN-046',
      rollingWindowKm: 100.0,
      steeringAngleMeanOffsetDeg: 0.4,
      lateralDriftRateMps2: 0.1,
      yawRateVariance: 0.05,
    });

    expect(log.alignmentStatus).toBe(AlignmentStatus.PERFECT);
    expect(log.depotMaintenanceRequired).toBe(false);
  });
});
