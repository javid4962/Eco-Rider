import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CaptainPensionService } from '../src/modules/captain-pension/captain-pension.service';
import { CaptainPensionAccount } from '../src/database/entities/captain-pension-account.entity';
import { PensionDeductionRecord } from '../src/database/entities/pension-deduction-record.entity';

describe('CaptainPensionService (Milestone M66)', () => {
  let service: CaptainPensionService;

  const mockAccounts: any[] = [];
  const mockDeductions: any[] = [];

  const mockAccountRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockAccounts.find((a) => {
        if (where.captainId && a.captainId !== where.captainId) return false;
        if (where.isActive !== undefined && a.isActive !== where.isActive) return false;
        return true;
      });
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `pension-${Date.now()}`,
      ...dto,
      enrolledAt: new Date(),
    })),
    save: jest.fn().mockImplementation((a) => {
      const idx = mockAccounts.findIndex((item) => item.captainId === a.captainId);
      if (idx >= 0) {
        mockAccounts[idx] = a;
      } else {
        mockAccounts.push(a);
      }
      return Promise.resolve(a);
    }),
  };

  const mockDeductionRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      id: `ded-${Date.now()}`,
      ...dto,
      deductedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((d) => {
      mockDeductions.push(d);
      return Promise.resolve(d);
    }),
  };

  beforeEach(async () => {
    mockAccounts.length = 0;
    mockDeductions.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptainPensionService,
        { provide: getRepositoryToken(CaptainPensionAccount), useValue: mockAccountRepo },
        { provide: getRepositoryToken(PensionDeductionRecord), useValue: mockDeductionRepo },
      ],
    }).compile();

    service = module.get<CaptainPensionService>(CaptainPensionService);
  });

  it('should enroll captain into voluntary pension with PRAN', async () => {
    const res = await service.enrollPension({
      captainId: 'captain-ap-01',
      pranNumber: 'PRAN-110022334455',
      dailyContributionPaise: 2000, // ₹20.00/day
    });

    expect(res).toBeDefined();
    expect(res.captainId).toBe('captain-ap-01');
    expect(res.pranNumber).toBe('PRAN-110022334455');
    expect(res.dailyContributionPaise).toBe(2000);
    expect(res.totalAccumulatedPaise).toBe(0);
  });

  it('should record daily pension deduction and increment accumulated balance', async () => {
    await service.enrollPension({
      captainId: 'captain-ap-02',
      pranNumber: 'PRAN-998877665544',
      dailyContributionPaise: 3000,
    });

    const updated = await service.recordDeduction({
      captainId: 'captain-ap-02',
      deductionAmountPaise: 3000,
      tripId: '00000000-0000-0000-0000-000000000001',
    });

    expect(updated.totalAccumulatedPaise).toBe(3000);
    expect(updated.totalDaysContributed).toBe(1);
    expect(mockDeductions.length).toBe(1);
  });

  it('should reject enrollment if daily contribution is below minimum 500 paise', async () => {
    await expect(
      service.enrollPension({
        captainId: 'captain-ap-03',
        pranNumber: 'PRAN-000',
        dailyContributionPaise: 200,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException on deducting from unregistered captain', async () => {
    await expect(
      service.recordDeduction({
        captainId: 'captain-unregistered',
        deductionAmountPaise: 1000,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
