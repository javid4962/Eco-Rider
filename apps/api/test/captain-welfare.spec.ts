import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CaptainWelfareService } from '../src/modules/captain-welfare/captain-welfare.service';
import { CaptainWelfareController } from '../src/modules/captain-welfare/captain-welfare.controller';
import { CaptainWelfareLedger } from '../src/database/entities/captain-welfare-ledger.entity';
import { MedicalClaim } from '../src/database/entities/medical-claim.entity';
import { MedicalClaimStatus } from '@ecoride/contracts';

describe('CaptainWelfareService (M56)', () => {
  let service: CaptainWelfareService;
  let mockLedgerRepo: any;
  let mockClaimRepo: any;

  beforeEach(async () => {
    mockLedgerRepo = {
      findOne: jest.fn().mockResolvedValue({
        balanceAfterPaise: 4500000, // ₹45,000 reserve
      }),
      create: jest.fn((e) => ({ ...e, id: 'ledg-123', createdAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    mockClaimRepo = {
      create: jest.fn((e) => ({ ...e, id: 'clm-123', submittedAt: new Date(), updatedAt: new Date() })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaptainWelfareController],
      providers: [
        CaptainWelfareService,
        { provide: getRepositoryToken(CaptainWelfareLedger), useValue: mockLedgerRepo },
        { provide: getRepositoryToken(MedicalClaim), useValue: mockClaimRepo },
      ],
    }).compile();

    service = module.get<CaptainWelfareService>(CaptainWelfareService);
  });

  it('should submit captain emergency medical claim in SUBMITTED status', async () => {
    const claim = await service.submitMedicalClaim({
      captainId: 'c0000000-0000-4000-8000-000000000001',
      hospitalName: 'Manipal Hospital Tadepalle',
      treatmentType: 'Emergency Fracture Care',
      claimAmountPaise: 2500000, // ₹25,000.00
      dischargeSummaryUrl: 'https://docs.ecoride.in/claims/med-01.pdf',
    });

    expect(claim.claimNumber).toContain('MED-');
    expect(claim.status).toBe(MedicalClaimStatus.SUBMITTED);
    expect(claim.claimAmountPaise).toBe(2500000);
  });

  it('should approve and disburse medical assistance payout with double-entry reserve deduction', async () => {
    mockClaimRepo.findOne.mockResolvedValueOnce({
      id: 'clm-123',
      claimNumber: 'MED-TEST-01',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      hospitalName: 'Ramesh Hospitals Guntur',
      treatmentType: 'Cardiology Support',
      claimAmountPaise: 2000000,
      approvedAmountPaise: 0,
      status: MedicalClaimStatus.SUBMITTED,
      submittedAt: new Date(),
    });

    const disbursed = await service.disburseMedicalClaim('MED-TEST-01', 2000000); // ₹20,000 payout

    expect(disbursed.status).toBe(MedicalClaimStatus.DISBURSED);
    expect(disbursed.approvedAmountPaise).toBe(2000000);
    expect(disbursed.disbursedUtr).toContain('WLF-IMPS-');
    expect(mockLedgerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        entryType: 'DISBURSAL',
        amountPaise: 2000000,
      }),
    );
  });
});

