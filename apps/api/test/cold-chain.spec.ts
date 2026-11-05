import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ColdChainService } from '../src/modules/cold-chain/cold-chain.service';
import { ColdChainController } from '../src/modules/cold-chain/cold-chain.controller';
import { ColdChainShipment } from '../src/database/entities/cold-chain-shipment.entity';
import { ColdChainTelemetryLog } from '../src/database/entities/cold-chain-telemetry-log.entity';
import { ColdChainTemperatureRange } from '@ecoride/contracts';

describe('ColdChainService (M48)', () => {
  let service: ColdChainService;
  let mockShipmentRepo: any;
  let mockLogRepo: any;

  beforeEach(async () => {
    mockShipmentRepo = {
      create: jest.fn((e) => ({ ...e, id: 'ship-123', lastTelemetryAt: new Date() })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    mockLogRepo = {
      create: jest.fn((e) => ({ ...e, id: 'log-123' })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColdChainController],
      providers: [
        ColdChainService,
        { provide: getRepositoryToken(ColdChainShipment), useValue: mockShipmentRepo },
        { provide: getRepositoryToken(ColdChainTelemetryLog), useValue: mockLogRepo },
      ],
    }).compile();

    service = module.get<ColdChainService>(ColdChainService);
  });

  it('should initialize cold chain shipment with +2C to +8C bounds for CHILLED cargo', async () => {
    const shipment = await service.createShipment(
      'CN-DAIRY-01',
      'AP16EV9999',
      'Krishna Fresh Milk & Curd',
      ColdChainTemperatureRange.CHILLED,
    );

    expect(shipment.minAllowedTempCelsius).toBe(2.0);
    expect(shipment.maxAllowedTempCelsius).toBe(8.0);
    expect(shipment.isExcursionDetected).toBe(false);
  });

  it('should detect temperature excursion and emit warning when reefer temperature exceeds +8C', async () => {
    mockShipmentRepo.findOne.mockResolvedValueOnce({
      id: 'ship-123',
      consignmentId: 'CN-DAIRY-01',
      minAllowedTempCelsius: 2.0,
      maxAllowedTempCelsius: 8.0,
      totalExcursionsCount: 0,
      isExcursionDetected: false,
    });

    const alert = await service.ingestTelemetry({
      shipmentId: 'ship-123',
      reeferUnitId: 'REEFER-01',
      sensorTempCelsius: 10.2, // > 8.0C
      humidityPercent: 70.0,
      compressorActive: true,
      reeferBatterySocPercent: 68.0,
      recordedAt: new Date().toISOString(),
    });

    expect(alert).not.toBeNull();
    expect(alert?.actualTempCelsius).toBe(10.2);
    expect(alert?.allowedMaxTempCelsius).toBe(8.0);
    expect(mockShipmentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ isExcursionDetected: true, totalExcursionsCount: 1 }),
    );
  });
});

