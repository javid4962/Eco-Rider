import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorporateCostCenterService } from '../src/modules/corporate-cost-center/corporate-cost-center.service';
import { CorporateCostCenter } from '../src/database/entities/corporate-cost-center.entity';
import { CostCenterStatus } from '@ecoride/contracts';

describe('CorporateCostCenterService (M104)', () => {
  let service: CorporateCostCenterService;
  let repo: Partial<Record<keyof Repository<CorporateCostCenter>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-cc-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorporateCostCenterService,
        {
          provide: getRepositoryToken(CorporateCostCenter),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<CorporateCostCenterService>(CorporateCostCenterService);
  });

  it('should authorize employee ride when projected cost is within monthly department budget limit', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-cc-id',
      corporateAccountId: 'CORP-AMV-MEDTECH',
      departmentCode: 'DEPT-RND',
      monthlyBudgetLimitPaise: 5000000, // ₹50,000
      currentSpendPaise: 2000000,       // ₹20,000 spent so far
      status: CostCenterStatus.ACTIVE,
    });

    const result = await service.authorizeRide({
      corporateAccountId: 'CORP-AMV-MEDTECH',
      departmentCode: 'DEPT-RND',
      employeeId: 'EMP-MED-007',
      estimatedFarePaise: 35000, // ₹350
    });

    expect(result.isApproved).toBe(true);
    expect(result.currentSpendPaise).toBe(2035000);
    expect(result.remainingBudgetPaise).toBe(2965000);
    expect(result.rejectionReason).toBeNull();
    expect(repo.save).toHaveBeenCalled();
  });

  it('should reject employee ride when projected cost exceeds monthly department budget quota', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-cc-id',
      corporateAccountId: 'CORP-AMV-MEDTECH',
      departmentCode: 'DEPT-SALES',
      monthlyBudgetLimitPaise: 1000000, // ₹10,000
      currentSpendPaise: 980000,        // ₹9,800 spent (only ₹200 left)
      status: CostCenterStatus.ACTIVE,
    });

    const result = await service.authorizeRide({
      corporateAccountId: 'CORP-AMV-MEDTECH',
      departmentCode: 'DEPT-SALES',
      employeeId: 'EMP-SALES-101',
      estimatedFarePaise: 45000, // ₹450 > ₹200 remaining
    });

    expect(result.isApproved).toBe(false);
    expect(result.rejectionReason).toContain('Department monthly travel budget quota exceeded');
  });
});

