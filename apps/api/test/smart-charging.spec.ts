import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SmartChargingService } from '../src/modules/smart-charging/smart-charging.service';
import { SmartChargingController } from '../src/modules/smart-charging/smart-charging.controller';
import { SmartChargingProfile } from '../src/database/entities/smart-charging-profile.entity';
import { TransformerStationLoad } from '../src/database/entities/transformer-station-load.entity';
import { ChargingProfilePurposeType } from '@ecoride/contracts';

describe('SmartChargingService (M42)', () => {
  let service: SmartChargingService;
  let mockProfileRepo: any;
  let mockTransformerRepo: any;

  beforeEach(async () => {
    mockProfileRepo = {
      create: jest.fn((e) => ({ ...e, id: 'prof-123' })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    mockTransformerRepo = {
      create: jest.fn((e) => ({ ...e, id: 'tf-123' })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmartChargingController],
      providers: [
        SmartChargingService,
        { provide: getRepositoryToken(SmartChargingProfile), useValue: mockProfileRepo },
        { provide: getRepositoryToken(TransformerStationLoad), useValue: mockTransformerRepo },
      ],
    }).compile();

    service = module.get<SmartChargingService>(SmartChargingService);
  });

  it('should report normal load when transformer utilization is under 80%', async () => {
    mockTransformerRepo.findOne.mockResolvedValueOnce(null);

    const load = await service.evaluateTransformerLoad('s0000000-0000-4000-8000-000000000001', 4); // 4 * 60kW = 240kW (< 450kW capacity)

    expect(load.isThrottlingActive).toBe(false);
    expect(load.recommendedMaxKwPerGun).toBe(60.0);
    expect(load.currentLoadKw).toBe(240);
  });

  it('should activate dynamic throttling when transformer utilization exceeds 80%', async () => {
    mockTransformerRepo.findOne.mockResolvedValueOnce(null);

    const load = await service.evaluateTransformerLoad('s0000000-0000-4000-8000-000000000001', 8); // 8 * 60kW = 480kW (> 450kW capacity)

    expect(load.isThrottlingActive).toBe(true);
    expect(load.recommendedMaxKwPerGun).toBeLessThan(60.0);
    expect(load.recommendedMaxKwPerGun).toBeGreaterThanOrEqual(22.0);
  });

  it('should set OCPP 2.0.1 smart charging profile for connector', async () => {
    const profile = await service.setChargingProfile({
      stationId: 's0000000-0000-4000-8000-000000000001',
      connectorId: 2,
      maxPowerKw: 30.0,
      purpose: ChargingProfilePurposeType.TX_DEFAULT_PROFILE,
      durationMinutes: 120,
    });

    expect(profile.maxPowerKw).toBe(30.0);
    expect(profile.isActive).toBe(true);
    expect(profile.chargingProfilePurpose).toBe(ChargingProfilePurposeType.TX_DEFAULT_PROFILE);
  });
});

