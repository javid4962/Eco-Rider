import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CorporateApprovalsService } from '../src/modules/corporate-approvals/corporate-approvals.service';
import { CorporateRequisition } from '../src/database/entities/corporate-requisition.entity';
import { CorporateApprovalStatus } from '@ecoride/contracts';

describe('CorporateApprovalsService (M77)', () => {
  let service: CorporateApprovalsService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'req-001', ...dto })),
      save: jest.fn().mockImplementation(async (r) => ({ ...r })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorporateApprovalsService,
        {
          provide: getRepositoryToken(CorporateRequisition),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CorporateApprovalsService>(CorporateApprovalsService);
  });

  it('should auto-approve requisitions below ₹500 (50,000 paise) manager threshold', async () => {
    const result = await service.createRequisition({
      corporateAccountId: 'corp-tcs-vij',
      departmentCode: 'ENG',
      employeeUserId: 'emp-101',
      managerUserId: 'mgr-201',
      tripPurpose: 'Client meeting at Amaravathi Secretariat',
      estimatedFarePaise: 38000, // ₹380
      originAddress: 'Benz Circle',
      destinationAddress: 'Velagapudi',
    });

    expect(result.status).toBe(CorporateApprovalStatus.AUTO_APPROVED);
    expect(result.approvedFareCapPaise).toBe(38000);
    expect(result.gstTaxInvoiceEligible).toBe(true);
  });

  it('should require manager review for requisitions exceeding ₹500', async () => {
    const result = await service.createRequisition({
      corporateAccountId: 'corp-tcs-vij',
      departmentCode: 'FIN',
      employeeUserId: 'emp-102',
      managerUserId: 'mgr-201',
      tripPurpose: 'Audit visit to Guntur Regional Office',
      estimatedFarePaise: 85000, // ₹850
      originAddress: 'Vijayawada Junction',
      destinationAddress: 'Arundelpet, Guntur',
    });

    expect(result.status).toBe(CorporateApprovalStatus.PENDING_MANAGER_APPROVAL);
    expect(result.approvedFareCapPaise).toBe(0);
  });

  it('should allow manager to approve a pending requisition with full cap', async () => {
    const pendingReq = {
      id: 'req-pending-1',
      corporateAccountId: 'corp-tcs-vij',
      employeeUserId: 'emp-102',
      estimatedFarePaise: 85000,
      approvedFareCapPaise: 0,
      status: CorporateApprovalStatus.PENDING_MANAGER_APPROVAL,
    };
    mockRepo.findOne.mockResolvedValue(pendingReq);

    const reviewed = await service.reviewRequisition({
      requisitionId: 'req-pending-1',
      reviewerUserId: 'mgr-201',
      action: 'APPROVE',
      comments: 'Approved for official audit travel',
    });

    expect(reviewed.status).toBe(CorporateApprovalStatus.APPROVED);
    expect(reviewed.approvedFareCapPaise).toBe(85000);
    expect(reviewed.gstTaxInvoiceEligible).toBe(true);
  });

  it('should allow manager to reject a pending requisition', async () => {
    const pendingReq = {
      id: 'req-pending-2',
      corporateAccountId: 'corp-tcs-vij',
      employeeUserId: 'emp-103',
      estimatedFarePaise: 120000,
      approvedFareCapPaise: 0,
      status: CorporateApprovalStatus.PENDING_MANAGER_APPROVAL,
    };
    mockRepo.findOne.mockResolvedValue(pendingReq);

    const reviewed = await service.reviewRequisition({
      requisitionId: 'req-pending-2',
      reviewerUserId: 'mgr-201',
      action: 'REJECT',
      comments: 'Travel budget exhausted for this sprint',
    });

    expect(reviewed.status).toBe(CorporateApprovalStatus.REJECTED);
    expect(reviewed.approvedFareCapPaise).toBe(0);
    expect(reviewed.gstTaxInvoiceEligible).toBe(false);
  });
});
