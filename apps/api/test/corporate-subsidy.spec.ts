import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CorporateSubsidyService } from '../src/modules/corporate-subsidy/corporate-subsidy.service';
import { CorporateSubsidyController } from '../src/modules/corporate-subsidy/corporate-subsidy.controller';
import { CorporateSubsidyPolicy } from '../src/database/entities/corporate-subsidy-policy.entity';
import { EmployeeSubsidyClaim } from '../src/database/entities/employee-subsidy-claim.entity';
import { SubsidyType } from '@ecoride/contracts';

describe('CorporateSubsidyService (M47)', () => {
  let service: CorporateSubsidyService;
  let mockPolicyRepo: any;
  let mockClaimRepo: any;

  beforeEach(async () => {
    mockPolicyRepo = {
      findOne: jest.fn(),
    };

    mockClaimRepo = {
      create: jest.fn((e) => ({ ...e, id: 'claim-123' })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorporateSubsidyController],
      providers: [
        CorporateSubsidyService,
        { provide: getRepositoryToken(CorporateSubsidyPolicy), useValue: mockPolicyRepo },
        { provide: getRepositoryToken(EmployeeSubsidyClaim), useValue: mockClaimRepo },
      ],
    }).compile();

    service = module.get<CorporateSubsidyService>(CorporateSubsidyService);
  });

  it('should calculate 70% employer subsidy capped at per-trip ceiling', async () => {
    mockPolicyRepo.findOne.mockResolvedValueOnce({
      id: 'pol-1',
      corporateAccountId: 'corp-001',
      companyName: 'AP Capital Tech Labs',
      subsidyType: SubsidyType.PERCENTAGE_SPLIT,
      subsidyPercentage: 70.0,
      maxPerTripSubsidyPaise: 20000, // ₹200.00
      monthlyPerEmployeeCapPaise: 500000,
      allowedZones: ['Amaravathi Secretariat Corridor', 'Benz Circle'],
      isActive: true,
    });

    const res = await service.calculateSubsidy({
      corporateAccountId: 'corp-001',
      employeeUserId: 'u0000000-0000-4000-8000-000000000001',
      farePaise: 25000, // ₹250.00 (70% = ₹175.00 <= ₹200 cap)
      pickupZone: 'Benz Circle',
    });

    expect(res.subsidyApplied).toBe(true);
    expect(res.subsidizedAmountPaise).toBe(17500); // ₹175.00
    expect(res.employeeRemainingPaise).toBe(7500); // ₹75.00
  });

  it('should enforce per-trip cap when 70% subsidy exceeds max cap', async () => {
    mockPolicyRepo.findOne.mockResolvedValueOnce({
      id: 'pol-1',
      corporateAccountId: 'corp-001',
      subsidyType: SubsidyType.PERCENTAGE_SPLIT,
      subsidyPercentage: 70.0,
      maxPerTripSubsidyPaise: 15000, // ₹150.00 cap
      allowedZones: [],
      isActive: true,
    });

    const res = await service.calculateSubsidy({
      corporateAccountId: 'corp-001',
      employeeUserId: 'u0000000-0000-4000-8000-000000000001',
      farePaise: 30000, // ₹300.00 (70% = ₹210.00 > ₹150.00 cap)
      pickupZone: 'Guntur Collectorate',
    });

    expect(res.subsidizedAmountPaise).toBe(15000); // Capped at ₹150.00
    expect(res.employeeRemainingPaise).toBe(15000); // ₹150.00
  });

  it('should reject subsidy when ride pickup is outside authorized corporate geofences', async () => {
    mockPolicyRepo.findOne.mockResolvedValueOnce({
      id: 'pol-1',
      corporateAccountId: 'corp-001',
      allowedZones: ['Amaravathi Secretariat Corridor'],
      isActive: true,
    });

    const res = await service.calculateSubsidy({
      corporateAccountId: 'corp-001',
      employeeUserId: 'u0000000-0000-4000-8000-000000000001',
      farePaise: 20000,
      pickupZone: 'Tirupati Temple Road', // Not in allowed zones
    });

    expect(res.subsidyApplied).toBe(false);
    expect(res.subsidizedAmountPaise).toBe(0);
    expect(res.employeeRemainingPaise).toBe(20000);
  });
});

