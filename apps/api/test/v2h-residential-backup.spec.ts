import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { V2hResidentialBackupService } from '../src/modules/v2h-residential-backup/v2h-residential-backup.service';
import { V2hResidentialSession } from '../src/database/entities/v2h-residential-session.entity';
import { V2hDischargeStatus } from '@ecoride/contracts';

describe('V2hResidentialBackupService (M109)', () => {
  let service: V2hResidentialBackupService;
  let repo: Partial<Record<keyof Repository<V2hResidentialSession>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-v2h-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V2hResidentialBackupService,
        {
          provide: getRepositoryToken(V2hResidentialSession),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<V2hResidentialBackupService>(V2hResidentialBackupService);
  });

  it('should initiate V2H discharge session for critical medical oxygen concentrator backup', async () => {
    const result = await service.initiateV2hSession({
      householdAccountId: 'HOUSE-AMV-MED-01',
      vehicleId: 'VEH-AP-37-AMV-101',
      contractedKwh: 4.0,
      criticalLoadType: 'MEDICAL_OXYGEN_CONCENTRATOR',
    });

    expect(result.sessionId).toBeDefined();
    expect(result.householdAccountId).toBe('HOUSE-AMV-MED-01');
    expect(result.dischargeTariffPaisePerKwh).toBe(1400); // ₹14.00/kWh
    expect(result.status).toBe(V2hDischargeStatus.DISCHARGING);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should trip emergency reserve trip protection when EV traction battery drops under 20% SoC', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-v2h-id',
      householdAccountId: 'HOUSE-AMV-MED-01',
      vehicleId: 'VEH-AP-37-AMV-101',
      contractedKwh: 4.0,
      energyDeliveredKwh: 2.2,
      dischargeTariffPaisePerKwh: 1400,
      totalEarningsPaise: 3080,
      status: V2hDischargeStatus.DISCHARGING,
    });

    const updated = await service.updateTelemetry({
      sessionId: 'mock-v2h-id',
      energyDeliveredKwh: 2.5,
      batteryRemainingSoc: 19.5, // drops below 20%
    });

    expect(updated.status).toBe(V2hDischargeStatus.EMERGENCY_RESERVE_TRIP);
    expect(updated.endedAt).toBeDefined();
    expect(updated.totalEarningsPaise).toBe(3500); // 2.5 kWh * 1400 paise = ₹35.00
  });

  it('should reach target completed state when contracted energy (4.0 kWh) has been safely delivered', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-v2h-id',
      householdAccountId: 'HOUSE-AMV-MED-01',
      vehicleId: 'VEH-AP-37-AMV-101',
      contractedKwh: 4.0,
      energyDeliveredKwh: 3.5,
      dischargeTariffPaisePerKwh: 1400,
      totalEarningsPaise: 4900,
      status: V2hDischargeStatus.DISCHARGING,
    });

    const updated = await service.updateTelemetry({
      sessionId: 'mock-v2h-id',
      energyDeliveredKwh: 4.0,
      batteryRemainingSoc: 45.0,
    });

    expect(updated.status).toBe(V2hDischargeStatus.TARGET_REACHED);
    expect(updated.totalEarningsPaise).toBe(5600); // 4.0 kWh * 1400 paise = ₹56.00
  });
});
