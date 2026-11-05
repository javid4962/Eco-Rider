import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ColdChainInsuranceService } from '../src/modules/cold-chain-insurance/cold-chain-insurance.service';
import { ColdChainExcursionClaim } from '../src/database/entities/cold-chain-excursion-claim.entity';
import { ColdChainCargoType, ExcursionClaimStatus } from '@ecoride/contracts';

describe('ColdChainInsuranceService (M73)', () => {
  let service: ColdChainInsuranceService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'claim-1234', ...dto })),
      save: jest.fn().mockImplementation(async (claim) => ({ ...claim })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColdChainInsuranceService,
        {
          provide: getRepositoryToken(ColdChainExcursionClaim),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ColdChainInsuranceService>(ColdChainInsuranceService);
  });

  it('should report NORMAL status when pharmaceutical cargo is within +2°C to +8°C', async () => {
    const result = await service.processTelemetry({
      cargoTripId: 'trip-pharma-01',
      vehicleId: 'veh-ev-cargo-1',
      cargoType: ColdChainCargoType.PHARMACEUTICAL_VACCINES,
      temperatureCelsius: 4.5,
      humidityPercent: 55,
      ambientTemperatureCelsius: 38.0,
      latitude: 16.5062,
      longitude: 80.648,
      consignorId: 'consignor-aiims-mangalagiri',
      declaredCargoValuePaise: 10000000, // ₹100,000
      timestamp: new Date().toISOString(),
    });

    expect(result.status).toBe(ExcursionClaimStatus.NORMAL);
    expect(result.claim).toBeUndefined();
  });

  it('should automatically file insurance claim upon temperature breach for vaccines', async () => {
    const result = await service.processTelemetry({
      cargoTripId: 'trip-pharma-01',
      vehicleId: 'veh-ev-cargo-1',
      cargoType: ColdChainCargoType.PHARMACEUTICAL_VACCINES,
      temperatureCelsius: 11.2, // Breach > 8°C
      humidityPercent: 62,
      ambientTemperatureCelsius: 40.5,
      latitude: 16.5062,
      longitude: 80.648,
      consignorId: 'consignor-aiims-mangalagiri',
      declaredCargoValuePaise: 20000000, // ₹200,000
      timestamp: new Date().toISOString(),
    });

    expect(result.status).toBe(ExcursionClaimStatus.CLAIM_FILED);
    expect(result.claim).toBeDefined();
    // 80% of 200,000 = 160,000 (16,000,000 paise)
    expect(result.claim?.insuranceClaimAmountPaise).toBe(16000000);
    expect(result.claim?.claimReferenceNumber).toMatch(/^CLM-EXC-/);
  });

  it('should settle an active claim and update status to CLAIM_SETTLED', async () => {
    const filedClaim = {
      id: 'claim-1234',
      claimReferenceNumber: 'CLM-EXC-ABC-1234',
      status: ExcursionClaimStatus.CLAIM_FILED,
    };
    mockRepo.findOne.mockResolvedValue(filedClaim);

    const settled = await service.settleClaim('CLM-EXC-ABC-1234');
    expect(settled.status).toBe(ExcursionClaimStatus.CLAIM_SETTLED);
  });
});
