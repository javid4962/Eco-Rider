import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BmsWarrantyTelemetryService } from '../src/modules/bms-warranty-telemetry/bms-warranty-telemetry.service';
import { BmsWarrantyTelemetryController } from '../src/modules/bms-warranty-telemetry/bms-warranty-telemetry.controller';
import { BmsWarrantyTelemetryLogEntity } from '../src/database/entities/bms-warranty-telemetry-log.entity';

describe('BmsWarrantyTelemetryModule', () => {
  let service: BmsWarrantyTelemetryService;
  let controller: BmsWarrantyTelemetryController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-bms-log-uuid',
      timestamp: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BmsWarrantyTelemetryController],
      providers: [
        BmsWarrantyTelemetryService,
        {
          provide: getRepositoryToken(BmsWarrantyTelemetryLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BmsWarrantyTelemetryService>(BmsWarrantyTelemetryService);
    controller = module.get<BmsWarrantyTelemetryController>(BmsWarrantyTelemetryController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should allow full fast charging power when cell temperatures are below 45°C', async () => {
    const result = await controller.evaluateThermalReading({
      vehicleId: 'EV-SEDAN-AP37-1100',
      batterySerial: 'BAT-CATL-LFP-8899',
      maxCellTemperatureCelsius: 38.5,
      minCellTemperatureCelsius: 36.2,
      cellTemperatureDeltaCelsius: 2.3,
      requestedFastChargeKw: 60,
    });

    expect(result.actionTaken).toBe('ALLOW_FAST_CHARGE');
    expect(result.allowedPowerKw).toBe(60);
    expect(result.warrantyProtectionActive).toBe(false);
  });

  it('should block fast charge and assign cooling bay if cell temperature exceeds 48°C warranty limit', async () => {
    const result = await controller.evaluateThermalReading({
      vehicleId: 'EV-SEDAN-AP37-1100',
      batterySerial: 'BAT-CATL-LFP-8899',
      maxCellTemperatureCelsius: 49.8,
      minCellTemperatureCelsius: 45.1,
      cellTemperatureDeltaCelsius: 4.7,
      requestedFastChargeKw: 60,
    });

    expect(result.actionTaken).toBe('BLOCK_AND_ROUTE_COOLING');
    expect(result.allowedPowerKw).toBe(0);
    expect(result.depotCoolingBayAssigned).toBeDefined();
    expect(result.warrantyProtectionActive).toBe(true);
  });
});

