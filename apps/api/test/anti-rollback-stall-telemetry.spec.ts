import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AntiRollbackStallTelemetryService } from '../src/modules/anti-rollback-stall-telemetry/anti-rollback-stall-telemetry.service';
import { AntiRollbackStallTelemetryController } from '../src/modules/anti-rollback-stall-telemetry/anti-rollback-stall-telemetry.controller';
import { AntiRollbackStallEventEntity } from '../src/database/entities/anti-rollback-stall-event.entity';

describe('AntiRollbackStallTelemetryModule', () => {
  let service: AntiRollbackStallTelemetryService;
  let controller: AntiRollbackStallTelemetryController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-rollback-uuid',
      timestamp: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AntiRollbackStallTelemetryController],
      providers: [
        AntiRollbackStallTelemetryService,
        {
          provide: getRepositoryToken(AntiRollbackStallEventEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AntiRollbackStallTelemetryService>(AntiRollbackStallTelemetryService);
    controller = module.get<AntiRollbackStallTelemetryController>(AntiRollbackStallTelemetryController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should detect critical rollback stall on Kanaka Durga flyover incline and activate holding torque boost', async () => {
    const result = await controller.evaluateRollback({
      vehicleId: 'EV-AUTO-AP37-1234',
      inclineGradeAngleDegrees: 7.8, // Steep flyover incline
      flyoverName: 'Kanaka Durga Flyover',
      vehicleSpeedKmph: -2.2, // Negative speed = sliding backwards
      motorTorqueNm: 40.0,
      throttlePedalPct: 65.0,
      grossVehicleWeightKg: 820.0, // Heavily loaded e-auto
    });

    expect(result.rollbackDetected).toBe(true);
    expect(result.severity).toBe('CRITICAL_STALL_WARNING');
    expect(result.holdingTorqueBoostNm).toBe(85.0);
    expect(result.hillStartAssistActive).toBe(true);
    expect(result.alertIssued).toBe(true);
  });

  it('should report normal status when vehicle is progressing forward smoothly on incline', async () => {
    const result = await controller.evaluateRollback({
      vehicleId: 'EV-AUTO-AP37-1234',
      inclineGradeAngleDegrees: 5.0,
      flyoverName: 'Kanaka Durga Flyover',
      vehicleSpeedKmph: 18.5,
      motorTorqueNm: 60.0,
      throttlePedalPct: 50.0,
      grossVehicleWeightKg: 650.0,
    });

    expect(result.rollbackDetected).toBe(false);
    expect(result.severity).toBe('NORMAL');
    expect(result.holdingTorqueBoostNm).toBe(0);
  });
});
