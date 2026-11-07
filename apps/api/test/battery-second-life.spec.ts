import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatterySecondLifeService } from '../src/modules/battery-second-life/battery-second-life.service';
import { BatterySecondLifeAssessment } from '../src/database/entities/battery-second-life-assessment.entity';
import { BatteryHealthGrade, SecondLifeDutyRating } from '@ecoride/contracts';

describe('BatterySecondLifeService (M91)', () => {
  let service: BatterySecondLifeService;
  let repo: Partial<Record<keyof Repository<BatterySecondLifeAssessment>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-uuid', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatterySecondLifeService,
        {
          provide: getRepositoryToken(BatterySecondLifeAssessment),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<BatterySecondLifeService>(BatterySecondLifeService);
  });

  it('should qualify degraded battery (65% SoH) for stationary depot BESS duty', async () => {
    const result = await service.evaluateSecondLife({
      batterySerial: 'BAT-TATA-NEXON-001',
      originalVehicleId: 'VEH-AP-37-VJA-001',
      originalCapacityKwh: 40.0,
      measuredCapacityKwh: 26.0, // 65% SoH
      internalResistanceMilliohm: 28,
      nominalResistanceMilliohm: 20, // ratio = 1.4 <= 1.8
      cycleCount: 1800,
      cellDegradationSpreadMv: 22, // <= 30mV -> DEPOT_STATIONARY_STORAGE
    });

    expect(result.stateOfHealthPercent).toBe(65.0);
    expect(result.healthGrade).toBe(BatteryHealthGrade.GRADE_B_SECOND_LIFE);
    expect(result.isEligibleForSecondLife).toBe(true);
    expect(result.assignedDuty).toBe(SecondLifeDutyRating.DEPOT_STATIONARY_STORAGE);
    expect(result.recommendedMaxCrate).toBe(0.5);
    expect(result.estimatedRemainingCycles).toBeGreaterThan(0);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should reject heavily degraded battery (< 50% SoH) for second life and assign recycle grade', async () => {
    const result = await service.evaluateSecondLife({
      batterySerial: 'BAT-MAHINDRA-EV-999',
      originalVehicleId: 'VEH-AP-37-GNT-999',
      originalCapacityKwh: 30.0,
      measuredCapacityKwh: 12.0, // 40% SoH
      internalResistanceMilliohm: 45,
      nominalResistanceMilliohm: 20, // ratio = 2.25 > 1.8
      cycleCount: 3200,
      cellDegradationSpreadMv: 60,
    });

    expect(result.stateOfHealthPercent).toBe(40.0);
    expect(result.healthGrade).toBe(BatteryHealthGrade.GRADE_C_RECYCLE);
    expect(result.isEligibleForSecondLife).toBe(false);
    expect(result.assignedDuty).toBe(SecondLifeDutyRating.REJECTED);
  });
});

