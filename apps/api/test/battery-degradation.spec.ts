import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BatteryDegradationService } from '../src/modules/battery-degradation/battery-degradation.service';
import { BatteryDegradationController } from '../src/modules/battery-degradation/battery-degradation.controller';
import { BatteryDegradationRecord } from '../src/database/entities/battery-degradation-record.entity';
import { BessRepurposingOrder } from '../src/database/entities/bess-repurposing-order.entity';

describe('BatteryDegradationService (M51)', () => {
  let service: BatteryDegradationService;
  let mockRecordRepo: any;
  let mockOrderRepo: any;

  beforeEach(async () => {
    mockRecordRepo = {
      create: jest.fn((e) => ({ ...e, id: 'deg-123', evaluatedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    mockOrderRepo = {
      create: jest.fn((e) => ({ ...e, id: 'ord-123', createdAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatteryDegradationController],
      providers: [
        BatteryDegradationService,
        { provide: getRepositoryToken(BatteryDegradationRecord), useValue: mockRecordRepo },
        { provide: getRepositoryToken(BessRepurposingOrder), useValue: mockOrderRepo },
      ],
    }).compile();

    service = module.get<BatteryDegradationService>(BatteryDegradationService);
  });

  it('should maintain operational status when battery SoH is >= 70%', async () => {
    const res = await service.evaluateDegradation({
      batteryPackSerial: 'BAT-LFP-001',
      vehicleRegistrationNumber: 'AP16EV1234',
      initialCapacityKwh: 40.0,
      currentCapacityKwh: 34.0, // 85% SoH
      cycleCount: 600,
      averageOperatingTempCelsius: 35.0,
    });

    expect(res.stateOfHealthPercent).toBe(85.0);
    expect(res.secondLifeRecommended).toBe(false);
    expect(mockOrderRepo.save).not.toHaveBeenCalled();
  });

  it('should recommend second-life repurposing and issue BESS order when SoH < 70%', async () => {
    const res = await service.evaluateDegradation({
      batteryPackSerial: 'BAT-LFP-002',
      vehicleRegistrationNumber: 'AP16EV9999',
      initialCapacityKwh: 40.0,
      currentCapacityKwh: 26.0, // 65% SoH (< 70%)
      cycleCount: 1800,
      averageOperatingTempCelsius: 41.0,
    });

    expect(res.stateOfHealthPercent).toBe(65.0);
    expect(res.secondLifeRecommended).toBe(true);
    expect(mockOrderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        batteryPackSerial: 'BAT-LFP-002',
        intendedUse: 'Depot Stationary Solar Energy Storage Buffer',
      }),
    );
  });
});

