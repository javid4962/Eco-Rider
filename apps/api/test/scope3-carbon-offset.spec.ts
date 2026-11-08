import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Scope3CarbonOffsetService } from '../src/modules/scope3-carbon-offset/scope3-carbon-offset.service';
import { Scope3CarbonOffsetController } from '../src/modules/scope3-carbon-offset/scope3-carbon-offset.controller';
import { Scope3CarbonCertificateEntity } from '../src/database/entities/scope3-carbon-certificate.entity';
import { CarbonStandard, OffsetVerificationStatus } from '@ecoride/contracts';

describe('Scope3CarbonOffsetModule', () => {
  let service: Scope3CarbonOffsetService;
  let controller: Scope3CarbonOffsetController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-scope3-uuid',
      certifiedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-scope3-uuid') {
        return {
          id: 'mock-scope3-uuid',
          verificationStatus: OffsetVerificationStatus.CERTIFIED,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Scope3CarbonOffsetController],
      providers: [
        Scope3CarbonOffsetService,
        {
          provide: getRepositoryToken(Scope3CarbonCertificateEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<Scope3CarbonOffsetService>(Scope3CarbonOffsetService);
    controller = module.get<Scope3CarbonOffsetController>(Scope3CarbonOffsetController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should accurately calculate avoided CO2 emissions and SHA-256 certificate for corporate employee transit', async () => {
    const cert = await controller.generate({
      corporateAccountId: 'CORP-INFOSYS-VIJAYAWADA',
      reportingMonth: '2026-11',
      standard: CarbonStandard.GHG_PROTOCOL_SCOPE3_CAT6,
      totalElectricKm: 10000.0,
      isCargoMovement: false, // Passenger transport (0.162 kg CO2/km)
    });

    expect(cert.totalElectricKm).toBe(10000.0);
    expect(cert.avoidedCo2Kg).toBe(1620.0); // 10,000 * 0.162
    expect(cert.displacedDieselLiters).toBe(604.48); // 1,620 / 2.68
    expect(cert.verificationStatus).toBe(OffsetVerificationStatus.CERTIFIED);
    expect(cert.certificateHashSha256).toHaveLength(64);
  });

  it('should calculate higher avoided emission factors for commercial cargo electric movements', async () => {
    const cert = await controller.generate({
      corporateAccountId: 'CORP-AMAZON-AP-LOGISTICS',
      reportingMonth: '2026-11',
      standard: CarbonStandard.ISO_14064_PART1,
      totalElectricKm: 5000.0,
      isCargoMovement: true, // Cargo (0.420 kg CO2/km)
    });

    expect(cert.avoidedCo2Kg).toBe(2100.0); // 5,000 * 0.420
    expect(cert.displacedDieselLiters).toBe(783.58);
  });
});
