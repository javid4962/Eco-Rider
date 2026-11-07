import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptainEcoBonusService } from '../src/modules/captain-eco-bonus/captain-eco-bonus.service';
import { CaptainEcoDrivingRecord } from '../src/database/entities/captain-eco-driving-record.entity';
import { EcoDrivingTier } from '@ecoride/contracts';

describe('CaptainEcoBonusService (M107)', () => {
  let service: CaptainEcoBonusService;
  let repo: Partial<Record<keyof Repository<CaptainEcoDrivingRecord>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-eco-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptainEcoBonusService,
        {
          provide: getRepositoryToken(CaptainEcoDrivingRecord),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<CaptainEcoBonusService>(CaptainEcoBonusService);
  });

  it('should award ₹1,500 monthly green performance bonus for exemplary eco-driving (score >= 85)', async () => {
    const result = await service.evaluateTripPerformance({
      captainId: 'CAPTAIN-ECO-001',
      vehicleId: 'VEH-AP-37-VJA-101',
      totalDistanceKm: 45.0,
      energyConsumedKwh: 6.0,
      regenEnergyRecoveredKwh: 1.5, // 25% regen ratio (>= 20% -> +10 bonus)
      hardBrakingEvents: 1,        // -5
      rapidAccelerationEvents: 1,  // -5
    });

    // 100 - 5 - 5 + 10 = 100
    expect(result.ecoScore).toBe(100);
    expect(result.tier).toBe(EcoDrivingTier.EXEMPLARY_GREEN);
    expect(result.monthlyBonusEligible).toBe(true);
    expect(result.bonusAmountPaise).toBe(150000); // ₹1,500
    expect(result.regenEfficiencyRatio).toBe(0.25);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should assign standard tier and 0 bonus when harsh driving events reduce eco-score below 70', async () => {
    const result = await service.evaluateTripPerformance({
      captainId: 'CAPTAIN-ECO-002',
      vehicleId: 'VEH-AP-37-VJA-102',
      totalDistanceKm: 30.0,
      energyConsumedKwh: 8.0,
      regenEnergyRecoveredKwh: 0.8, // 10% regen ratio (< 20%)
      hardBrakingEvents: 5,        // -25
      rapidAccelerationEvents: 4,  // -20
    });

    // 100 - 25 - 20 = 55
    expect(result.ecoScore).toBe(55);
    expect(result.tier).toBe(EcoDrivingTier.STANDARD);
    expect(result.monthlyBonusEligible).toBe(false);
    expect(result.bonusAmountPaise).toBe(0);
  });
});

