import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CrashImpactTelemetryService } from '../src/modules/crash-impact-telemetry/crash-impact-telemetry.service';
import { CrashImpactTelemetryController } from '../src/modules/crash-impact-telemetry/crash-impact-telemetry.controller';
import { CrashImpactTelemetryEventEntity } from '../src/database/entities/crash-impact-telemetry-event.entity';
import { CrashSeverity, HighVoltageContactorStatus } from '@ecoride/contracts';

describe('CrashImpactTelemetryModule', () => {
  let service: CrashImpactTelemetryService;
  let controller: CrashImpactTelemetryController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-crash-uuid',
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-crash-uuid') {
        return {
          id: 'mock-crash-uuid',
          vehicleId: 'EV-AP39-TX-1001',
          decelerationGForce: 18.5,
          airbagDeployed: true,
          pyroFuseBlown: true,
          hvContactorStatus: HighVoltageContactorStatus.PYRO_FUSED,
          severity: CrashSeverity.SEVERE,
          emergency112Notified: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrashImpactTelemetryController],
      providers: [
        CrashImpactTelemetryService,
        {
          provide: getRepositoryToken(CrashImpactTelemetryEventEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CrashImpactTelemetryService>(CrashImpactTelemetryService);
    controller = module.get<CrashImpactTelemetryController>(CrashImpactTelemetryController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should detect severe collision, blow pyro-fuse, isolate HV battery, and notify AP Police 112', async () => {
    const event = await controller.ingest({
      vehicleId: 'EV-AP39-TX-1001',
      tripId: 'TRIP-BZA-9912',
      decelerationGForce: 18.5,
      airbagDeployed: true,
      pyroFuseBlown: true,
      packVoltageVolts: 72.0,
      isolationResistanceKOhms: 450.0,
      latitude: 16.518,
      longitude: 80.622,
      speedKmhAtImpact: 58.0,
      passengerCount: 2,
    });

    expect(event.severity).toBe(CrashSeverity.CATASTROPHIC);
    expect(event.hvContactorStatus).toBe(HighVoltageContactorStatus.PYRO_FUSED);
    expect(event.emergency112Notified).toBe(true);
    expect(event.emergencyDispatchRef).toContain('DISPATCH-112');
  });

  it('should retrieve crash event by id', async () => {
    const result = await controller.getById('mock-crash-uuid');
    expect(result.id).toBe('mock-crash-uuid');
    expect(result.emergency112Notified).toBe(true);
  });
});
