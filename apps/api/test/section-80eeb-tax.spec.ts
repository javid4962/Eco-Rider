import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Section80eebTaxService } from '../src/modules/section-80eeb-tax/section-80eeb-tax.service';
import { Section80eebTaxController } from '../src/modules/section-80eeb-tax/section-80eeb-tax.controller';
import { TaxRebateCertificateEntity } from '../src/database/entities/tax-rebate-certificate.entity';

describe('Section80eebTaxModule', () => {
  let service: Section80eebTaxService;
  let controller: Section80eebTaxController;

  const mockCert: Partial<TaxRebateCertificateEntity> = {
    id: 'mock-cert-uuid',
    certificateNumber: '80EEB-2026-2027-ABCD1234',
    taxpayerPan: 'ABCDE1234F',
    applicantType: 'INDIVIDUAL_CAPTAIN',
    vehicleVin: 'VIN-EV-AP37-9911',
    financialYear: '2026-2027',
    eligibleDeductionPaise: 12000000, // ₹1,20,000
    qrVerificationUrl: 'https://portal.ecoride.ap.gov.in/verify-tax/80eeb/80EEB-2026-2027-ABCD1234',
    issuedAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-cert-uuid',
      issuedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { certificateNumber } }) => {
      if (certificateNumber === '80EEB-2026-2027-ABCD1234') {
        return mockCert;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Section80eebTaxController],
      providers: [
        Section80eebTaxService,
        {
          provide: getRepositoryToken(TaxRebateCertificateEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<Section80eebTaxService>(Section80eebTaxService);
    controller = module.get<Section80eebTaxController>(Section80eebTaxController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should generate Section 80EEB tax rebate certificate capped at ₹1,50,000 statutory limit', async () => {
    const cert = await controller.generateCertificate({
      taxpayerPan: 'abcde1234f',
      applicantType: 'INDIVIDUAL_CAPTAIN',
      vehicleVin: 'VIN-EV-AP37-9911',
      loanSanctionDate: '2026-04-15T00:00:00Z',
      annualLoanInterestPaidPaise: 18000000, // ₹1,80,000 paid in interest
      financialYear: '2026-2027',
    });

    // Capped at ₹1,50,000 (15,000,000 paise)
    expect(cert.eligibleDeductionPaise).toBe(15000000);
    expect(cert.taxpayerPan).toBe('ABCDE1234F');
    expect(cert.certificateNumber).toContain('80EEB-2026-2027');
  });

  it('should retrieve existing tax rebate certificate by certificate number', async () => {
    const cert = await controller.getCertificate('80EEB-2026-2027-ABCD1234');
    expect(cert.certificateNumber).toBe('80EEB-2026-2027-ABCD1234');
    expect(cert.eligibleDeductionPaise).toBe(12000000);
  });
});

