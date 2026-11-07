import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BessMicrogridService } from '../src/modules/bess-microgrid/bess-microgrid.service';
import { DepotBessUnit } from '../src/database/entities/depot-bess-unit.entity';
import { BessOperatingMode } from '@ecoride/contracts';

describe('BessMicrogridService (M81)', () => {
  let service: BessMicrogridService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ id: 'bess-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (u) => ({ ...u })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BessMicrogridService,
        {
          provide: getRepositoryToken(DepotBessUnit),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BessMicrogridService>(BessMicrogridService);
  });

  it('should switch to SOLAR_CHARGING when excess solar generation is available', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    const result = await service.processTelemetry({
      depotId: 'depot-amaravathi-mega',
      bessUnitCode: 'BESS-AMAR-01',
      totalCapacityKwh: 500.0,
      currentSocPercent: 45.0,
      chargeRateKw: 0,
      dischargeRateKw: 0,
      temperatureCelsius: 32.0,
      solarInputKw: 85.0,
      gridPowerDemandKw: 30.0,
    });

    expect(result.mode).toBe(BessOperatingMode.SOLAR_CHARGING);
    expect(result.targetPowerKw).toBe(85.0);
    expect(result.peakShavingReliefKw).toBe(0);
  });

  it('should switch to GRID_PEAK_DISCHARGING to shave peak load and calculate tariff savings', async () => {
    const existingUnit = {
      id: 'bess-uuid-1',
      bessUnitCode: 'BESS-AMAR-01',
      currentSocPercent: 80.0,
    };
    mockRepo.findOne.mockResolvedValue(existingUnit);

    const result = await service.processTelemetry({
      depotId: 'depot-amaravathi-mega',
      bessUnitCode: 'BESS-AMAR-01',
      totalCapacityKwh: 500.0,
      currentSocPercent: 80.0,
      chargeRateKw: 0,
      dischargeRateKw: 0,
      temperatureCelsius: 34.0,
      solarInputKw: 5.0, // Low evening solar
      gridPowerDemandKw: 160.0, // Evening fleet charging peak
    });

    expect(result.mode).toBe(BessOperatingMode.GRID_PEAK_DISCHARGING);
    expect(result.targetPowerKw).toBe(80.0);
    expect(result.peakShavingReliefKw).toBe(80.0);
    // 80 kW * 500 paise = 40,000 paise (₹400 savings)
    expect(result.estimatedCostSavingsPaise).toBe(40000);
  });
});

