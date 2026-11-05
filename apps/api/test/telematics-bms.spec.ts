import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TelematicsBmsService } from '../src/modules/telematics-bms/telematics-bms.service';
import { TelematicsBmsController } from '../src/modules/telematics-bms/telematics-bms.controller';
import { VehicleBmsTelemetry } from '../src/database/entities/vehicle-bms-telemetry.entity';
import { BmsAlertIncident } from '../src/database/entities/bms-alert-incident.entity';
import { BmsThermalSafetyLevel } from '@ecoride/contracts';

describe('TelematicsBmsService (M33)', () => {
  let service: TelematicsBmsService;
  let mockBmsRepo: any;
  let mockAlertRepo: any;

  beforeEach(async () => {
    mockBmsRepo = {
      create: jest.fn((e) => ({ ...e, id: 'bms-123', recordedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'bms-123' })),
      findOne: jest.fn(),
    };

    mockAlertRepo = {
      create: jest.fn((e) => ({ ...e, id: 'alt-123', alertTimestamp: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'alt-123' })),
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelematicsBmsController],
      providers: [
        TelematicsBmsService,
        { provide: getRepositoryToken(VehicleBmsTelemetry), useValue: mockBmsRepo },
        { provide: getRepositoryToken(BmsAlertIncident), useValue: mockAlertRepo },
      ],
    }).compile();

    service = module.get<TelematicsBmsService>(TelematicsBmsService);
  });

  it('should ingest normal BMS telemetry when temperatures are healthy', async () => {
    const res = await service.ingestPing({
      vehicleId: 'b0000000-0000-4000-8000-000000000001',
      vehicleRegistrationNumber: 'AP-39-EV-1001',
      packVoltageVolts: 396.4,
      packCurrentAmperes: 24.5,
      cellVoltageMaxVolts: 3.65,
      cellVoltageMinVolts: 3.62,
      cellVoltageDeltaMv: 30.0,
      maxCellTempCelsius: 36.5,
      minCellTempCelsius: 34.0,
      inverterTempCelsius: 41.2,
      motorRpm: 3200,
      energyConsumptionWhPerKm: 135.0,
      stateOfChargePercent: 82.0,
      stateOfHealthPercent: 97.5,
      bmsThermalSafetyLevel: BmsThermalSafetyLevel.NORMAL,
      faultCodes: [],
      recordedAt: new Date().toISOString(),
    });

    expect(res.success).toBe(true);
    expect(res.safetyLevel).toBe(BmsThermalSafetyLevel.NORMAL);
    expect(res.alertTriggered).toBe(false);
    expect(mockAlertRepo.save).not.toHaveBeenCalled();
  });

  it('should detect CRITICAL_OVERHEAT when cell temp exceeds 55°C and trigger lockout alert', async () => {
    const res = await service.ingestPing({
      vehicleId: 'b0000000-0000-4000-8000-000000000001',
      vehicleRegistrationNumber: 'AP-39-EV-1001',
      packVoltageVolts: 388.0,
      packCurrentAmperes: 65.0,
      cellVoltageMaxVolts: 3.75,
      cellVoltageMinVolts: 3.55,
      cellVoltageDeltaMv: 200.0, // High imbalance
      maxCellTempCelsius: 58.0, // Overheating
      minCellTempCelsius: 49.0,
      inverterTempCelsius: 64.0,
      motorRpm: 4500,
      energyConsumptionWhPerKm: 195.0,
      stateOfChargePercent: 44.0,
      stateOfHealthPercent: 96.0,
      bmsThermalSafetyLevel: BmsThermalSafetyLevel.NORMAL,
      faultCodes: ['DTC_P0A7F'],
      recordedAt: new Date().toISOString(),
    });

    expect(res.safetyLevel).toBe(BmsThermalSafetyLevel.CRITICAL_OVERHEAT);
    expect(res.alertTriggered).toBe(true);
    expect(mockAlertRepo.save).toHaveBeenCalled();
  });

  it('should detect THERMAL_RUNAWAY_RISK when cell temp exceeds 65°C', async () => {
    const res = await service.ingestPing({
      vehicleId: 'b0000000-0000-4000-8000-000000000001',
      vehicleRegistrationNumber: 'AP-39-EV-1001',
      packVoltageVolts: 375.0,
      packCurrentAmperes: 85.0,
      cellVoltageMaxVolts: 3.9,
      cellVoltageMinVolts: 3.4,
      cellVoltageDeltaMv: 500.0,
      maxCellTempCelsius: 68.0, // Dangerous runaway risk
      minCellTempCelsius: 52.0,
      inverterTempCelsius: 75.0,
      motorRpm: 5000,
      energyConsumptionWhPerKm: 250.0,
      stateOfChargePercent: 30.0,
      stateOfHealthPercent: 94.0,
      bmsThermalSafetyLevel: BmsThermalSafetyLevel.NORMAL,
      faultCodes: ['DTC_CRITICAL_FIRE'],
      recordedAt: new Date().toISOString(),
    });

    expect(res.safetyLevel).toBe(BmsThermalSafetyLevel.THERMAL_RUNAWAY_RISK);
    expect(res.alertTriggered).toBe(true);
  });
});

