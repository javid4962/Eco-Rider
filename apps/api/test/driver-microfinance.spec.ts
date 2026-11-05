import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DriverMicrofinanceService } from '../src/modules/microfinance/driver-microfinance.service';
import { DriverMicrofinanceController } from '../src/modules/microfinance/driver-microfinance.controller';
import { CaptainEmiPlan } from '../src/database/entities/captain-emi-plan.entity';
import { EmiDeductionRecord } from '../src/database/entities/emi-deduction-record.entity';

describe('DriverMicrofinanceService (M49)', () => {
  let service: DriverMicrofinanceService;
  let mockPlanRepo: any;
  let mockRecordRepo: any;

  beforeEach(async () => {
    mockPlanRepo = {
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    mockRecordRepo = {
      create: jest.fn((e) => ({ ...e, id: 'ded-123' })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverMicrofinanceController],
      providers: [
        DriverMicrofinanceService,
        { provide: getRepositoryToken(CaptainEmiPlan), useValue: mockPlanRepo },
        { provide: getRepositoryToken(EmiDeductionRecord), useValue: mockRecordRepo },
      ],
    }).compile();

    service = module.get<DriverMicrofinanceService>(DriverMicrofinanceService);
  });

  it('should deduct full daily EMI when earnings are sufficient under 25% cap', async () => {
    mockPlanRepo.findOne.mockResolvedValueOnce({
      id: 'plan-1',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      dailyEmiInstallmentPaise: 25000, // ₹250.00 daily installment
      remainingBalancePaise: 1500000,
      totalPaidPaise: 500000,
      maxDeductionCapPercentage: 25.0,
      status: 'ACTIVE',
    });

    // Gross earnings ₹1,500.00 (150,000 paise). 25% = ₹375.00 >= ₹250.00 installment
    const res = await service.executeDailyDeduction({
      captainId: 'c0000000-0000-4000-8000-000000000001',
      grossEarningsTodayPaise: 150000,
      date: '2026-11-05',
    });

    expect(res.actualDeductedPaise).toBe(25000);
    expect(res.cappedBySafetyRule).toBe(false);
    expect(mockPlanRepo.save).toHaveBeenCalled();
  });

  it('should cap daily deduction at 25% of gross earnings to protect driver livelihood', async () => {
    mockPlanRepo.findOne.mockResolvedValueOnce({
      id: 'plan-1',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      dailyEmiInstallmentPaise: 25000, // ₹250.00 daily installment
      remainingBalancePaise: 1500000,
      totalPaidPaise: 500000,
      maxDeductionCapPercentage: 25.0,
      status: 'ACTIVE',
    });

    // Low gross earnings today: ₹400.00 (40,000 paise). 25% = ₹100.00 (10,000 paise)
    const res = await service.executeDailyDeduction({
      captainId: 'c0000000-0000-4000-8000-000000000001',
      grossEarningsTodayPaise: 40000,
      date: '2026-11-05',
    });

    expect(res.actualDeductedPaise).toBe(10000); // Only ₹100.00 deducted
    expect(res.cappedBySafetyRule).toBe(true);
    expect(res.notes).toContain('Livelihood guard applied');
  });
});

