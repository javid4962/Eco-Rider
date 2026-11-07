import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CarbonCreditsService } from '../src/modules/carbon-credits/carbon-credits.service';
import { CarbonCreditBatch } from '../src/database/entities/carbon-credit-batch.entity';

describe('CarbonCreditsService (M87)', () => {
  let service: CarbonCreditsService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'credit-batch-1',
        mintedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (b) => ({
        ...b,
        mintedAt: b.mintedAt || new Date(),
      })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarbonCreditsService,
        {
          provide: getRepositoryToken(CarbonCreditBatch),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CarbonCreditsService>(CarbonCreditsService);
  });

  it('should reject minting when avoided CO2 volume is zero or negative', async () => {
    await expect(
      service.mintCredits({
        batchIdentifier: 'BATCH-TEST-01',
        reportingPeriodStart: '2026-01-01',
        reportingPeriodEnd: '2026-03-31',
        totalElectricKm: 0,
        avoidedCo2Kg: 0,
        certifyingStandard: 'VERRA_VCS',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should mint discrete 1,000 kg carbon credit tokens and track fractional remainder', async () => {
    const result = await service.mintCredits({
      batchIdentifier: 'BATCH-AP-2026-Q1',
      reportingPeriodStart: '2026-01-01',
      reportingPeriodEnd: '2026-03-31',
      totalElectricKm: 250000,
      avoidedCo2Kg: 4250.75, // 4 credits + 250.75 kg remainder
      certifyingStandard: 'VERRA_VCS',
    });

    expect(result.totalCreditsMinted).toBe(4);
    expect(result.fractionalKgCarriedForward).toBe(250.75);
    expect(result.tokenSerialNumbers).toHaveLength(4);
    expect(result.tokenSerialNumbers[0]).toBe('ECO-VERRA_VCS-BATCH-AP-2026-Q1-0001');
    expect(result.verificationHash).toHaveLength(64);
  });
});

