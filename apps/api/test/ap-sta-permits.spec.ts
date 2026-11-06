import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ApStaPermitsService } from '../src/modules/ap-sta-permits/ap-sta-permits.service';
import { DigitalPermitRecord } from '../src/database/entities/digital-permit-record.entity';
import { PermitType, PermitComplianceStatus } from '@ecoride/contracts';

describe('ApStaPermitsService (M76)', () => {
  let service: ApStaPermitsService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'permit-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (p) => ({ ...p })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApStaPermitsService,
        {
          provide: getRepositoryToken(DigitalPermitRecord),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ApStaPermitsService>(ApStaPermitsService);
  });

  it('should reject permit creation if not flagged as 100% PUC and road tax exempt under AP EV Policy', async () => {
    await expect(
      service.issuePermit({
        permitNumber: 'AP39-EV-PERMIT-01',
        vehicleId: 'veh-ev-01',
        registrationNumber: 'AP 16 EV 1234',
        permitType: PermitType.EV_STAGE_CARRIAGE,
        rtoOfficeCode: 'AP-16',
        validFrom: '2026-01-01T00:00:00Z',
        validUntil: '2027-01-01T00:00:00Z',
        pucExempt: false, // Invalid for BEV
        roadTaxExempt: true,
        status: PermitComplianceStatus.COMPLIANT,
        verificationHash: 'fake-hash',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should issue digital permit with verifiable SHA-256 certificate hash', async () => {
    const permit = await service.issuePermit({
      permitNumber: 'AP39-EV-PERMIT-2026-0042',
      vehicleId: 'veh-ev-42',
      registrationNumber: 'AP 16 EV 9090',
      permitType: PermitType.EV_CONTRACT_CARRIAGE,
      rtoOfficeCode: 'AP-16',
      validFrom: '2026-01-01T00:00:00Z',
      validUntil: '2031-01-01T00:00:00Z',
      pucExempt: true,
      roadTaxExempt: true,
      status: PermitComplianceStatus.COMPLIANT,
      verificationHash: '',
    });

    expect(permit.permitNumber).toBe('AP39-EV-PERMIT-2026-0042');
    expect(permit.pucExempt).toBe(true);
    expect(permit.verificationHash).toHaveLength(64);
  });

  it('should renew an existing permit and collect statutory green permit fee', async () => {
    const existing = {
      id: 'permit-uuid-1',
      permitNumber: 'AP39-EV-PERMIT-2026-0042',
      registrationNumber: 'AP 16 EV 9090',
      validUntil: new Date('2026-12-31T00:00:00Z'),
      status: PermitComplianceStatus.EXPIRING_SOON,
      verificationHash: 'old-hash',
    };
    mockRepo.findOne.mockResolvedValue(existing);

    const renewal = await service.renewPermit({
      permitNumber: 'AP39-EV-PERMIT-2026-0042',
      renewalDurationMonths: 12,
    });

    expect(renewal.status).toBe(PermitComplianceStatus.COMPLIANT);
    expect(renewal.statutoryFeePaise).toBe(150000); // ₹1,500
    expect(renewal.newVerificationHash).not.toBe('old-hash');
  });
});

