import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Ais156BatterySwapService } from '../src/modules/ais156-battery-swap/ais156-battery-swap.service';
import { BatterySwapCompatibilityLog } from '../src/database/entities/battery-swap-compatibility-log.entity';
import { BatteryVendorStandard, Ais156SafetyVerdict } from '@ecoride/contracts';

describe('Ais156BatterySwapService (M78)', () => {
  let service: Ais156BatterySwapService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'swap-log-1', ...dto })),
      save: jest.fn().mockImplementation(async (l) => ({ ...l })),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Ais156BatterySwapService,
        {
          provide: getRepositoryToken(BatterySwapCompatibilityLog),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<Ais156BatterySwapService>(Ais156BatterySwapService);
  });

  it('should verify battery pack as SAFE_FOR_DEPLOYMENT when within AIS-156 limits', async () => {
    const result = await service.evaluateCompatibility({
      packSerialNumber: 'SUN-QPU-AP-9901',
      vendorStandard: BatteryVendorStandard.SUN_MOBILITY_QPU,
      maxCellTemperatureCelsius: 38.5,
      minCellTemperatureCelsius: 36.2,
      cellVoltageMaxVolts: 3.65,
      cellVoltageMinVolts: 3.62, // delta 30mV (<50mV)
      insulationResistanceMegaOhms: 250.0,
      socPercent: 98.0,
      sohPercent: 96.5,
      cycleCount: 140,
      waterIngressDetected: false,
    });

    expect(result.verdict).toBe(Ais156SafetyVerdict.SAFE_FOR_DEPLOYMENT);
    expect(result.isEligibleForSwap).toBe(true);
    expect(result.safetyInterlockEngaged).toBe(false);
  });

  it('should lock out battery pack for THERMAL_RUNAWAY_RISK if cell temperature exceeds 60°C', async () => {
    const result = await service.evaluateCompatibility({
      packSerialNumber: 'BATSMART-STD-0042',
      vendorStandard: BatteryVendorStandard.BATTERY_SMART_STD,
      maxCellTemperatureCelsius: 63.4, // > 60°C
      minCellTemperatureCelsius: 48.0,
      cellVoltageMaxVolts: 3.7,
      cellVoltageMinVolts: 3.65,
      insulationResistanceMegaOhms: 180.0,
      socPercent: 92.0,
      sohPercent: 88.0,
      cycleCount: 410,
      waterIngressDetected: false,
    });

    expect(result.verdict).toBe(Ais156SafetyVerdict.THERMAL_RUNAWAY_RISK);
    expect(result.isEligibleForSwap).toBe(false);
    expect(result.safetyInterlockEngaged).toBe(true);
  });

  it('should flag CELL_IMBALANCE_WARNING if delta cell voltage exceeds 50mV', async () => {
    const result = await service.evaluateCompatibility({
      packSerialNumber: 'ECO-INDIG-AP-01',
      vendorStandard: BatteryVendorStandard.ECORIDE_INDIGENOUS,
      maxCellTemperatureCelsius: 41.0,
      minCellTemperatureCelsius: 39.0,
      cellVoltageMaxVolts: 3.75,
      cellVoltageMinVolts: 3.68, // delta 70mV (>50mV)
      insulationResistanceMegaOhms: 220.0,
      socPercent: 85.0,
      sohPercent: 91.0,
      cycleCount: 220,
      waterIngressDetected: false,
    });

    expect(result.verdict).toBe(Ais156SafetyVerdict.CELL_IMBALANCE_WARNING);
    expect(result.isEligibleForSwap).toBe(false);
    expect(result.safetyInterlockEngaged).toBe(true);
  });

  it('should reject pack with INSULATION_RESISTANCE_FAULT if resistance < 100MΩ', async () => {
    const result = await service.evaluateCompatibility({
      packSerialNumber: 'RACE-SWAP-007',
      vendorStandard: BatteryVendorStandard.RACEENERGY_SWAP,
      maxCellTemperatureCelsius: 40.0,
      minCellTemperatureCelsius: 38.0,
      cellVoltageMaxVolts: 3.65,
      cellVoltageMinVolts: 3.63,
      insulationResistanceMegaOhms: 75.0, // < 100MΩ
      socPercent: 90.0,
      sohPercent: 94.0,
      cycleCount: 180,
      waterIngressDetected: false,
    });

    expect(result.verdict).toBe(Ais156SafetyVerdict.INSULATION_RESISTANCE_FAULT);
    expect(result.isEligibleForSwap).toBe(false);
    expect(result.safetyInterlockEngaged).toBe(true);
  });
});
