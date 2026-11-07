import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorporateGreenCommuteService } from '../src/modules/corporate-green-commute/corporate-green-commute.service';
import { CorporateGreenProfile } from '../src/database/entities/corporate-green-profile.entity';
import { GreenBadgeTier } from '@ecoride/contracts';

describe('CorporateGreenCommuteService (M95)', () => {
  let service: CorporateGreenCommuteService;
  let repo: Partial<Record<keyof Repository<CorporateGreenProfile>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-profile-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorporateGreenCommuteService,
        {
          provide: getRepositoryToken(CorporateGreenProfile),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<CorporateGreenCommuteService>(CorporateGreenCommuteService);
  });

  it('should accrue clean electric km, CO2 avoidance, and upgrade tier from Bronze to Silver (> 100 km)', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null); // new profile

    const result = await service.recordGreenTrip({
      corporateAccountId: 'CORP-HCL-VJA',
      employeeId: 'EMP-HCL-101',
      distanceKm: 120,
      cleanEnergyKwhUsed: 18.5,
    });

    expect(result.totalElectricKm).toBe(120);
    expect(result.totalKgCo2Saved).toBeCloseTo(19.44, 1); // 120 * 0.162
    expect(result.currentTier).toBe(GreenBadgeTier.SILVER_ECO_RIDER);
    expect(result.unlockedBadges).toContain('SILVER_ECO_RIDER');
    expect(result.unlockedBadges).toContain('CENTURY_RIDER');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should purchase certified corporate carbon offsets with generated verification certificate', async () => {
    const receipt = await service.purchaseCorporateOffset({
      corporateAccountId: 'CORP-INFOSYS-GNT',
      metricTonsCo2ToOffset: 50,
      offsetCostPaisePerTon: 85000, // ₹850 per ton
    });

    expect(receipt.purchaseId).toBeDefined();
    expect(receipt.metricTonsCo2Offset).toBe(50);
    expect(receipt.totalPaidPaise).toBe(4250000); // ₹42,500
    expect(receipt.certificateRef).toContain('AP-GREEN-VCM-');
  });
});

