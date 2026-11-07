import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CleanAirSubsidyService } from '../src/modules/clean-air-subsidy/clean-air-subsidy.service';
import { AqiMonitoringRecord } from '../src/database/entities/aqi-monitoring-record.entity';
import { AqiLevel } from '@ecoride/contracts';

describe('CleanAirSubsidyService (M98)', () => {
  let service: CleanAirSubsidyService;
  let repo: Partial<Record<keyof Repository<AqiMonitoringRecord>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-aqi-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanAirSubsidyService,
        {
          provide: getRepositoryToken(AqiMonitoringRecord),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<CleanAirSubsidyService>(CleanAirSubsidyService);
  });

  it('should activate clean air subsidy when AQI is POOR (> 200) in Auto Nagar, Vijayawada', async () => {
    const result = await service.ingestAqiTelemetry({
      stationCode: 'AQI-APPCB-VJA-AUTONAGAR',
      sensorLocation: 'Auto Nagar Industrial Zone, Vijayawada',
      aqiValue: 245,
      pm25: 110.5,
      pm10: 180.2,
      recordedAt: new Date().toISOString(),
    });

    expect(result.aqiLevel).toBe(AqiLevel.POOR);
    expect(result.isCleanAirSubsidyActive).toBe(true);
    expect(result.subsidyDiscountPercent).toBe(10);
    expect(result.maxSubsidyPaise).toBe(5000); // ₹50
    expect(repo.save).toHaveBeenCalled();
  });

  it('should discount passenger ride by 10% during high pollution while reimbursing driver via municipal grant', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-aqi-id',
      stationCode: 'AQI-APPCB-VJA-AUTONAGAR',
      aqiLevel: AqiLevel.POOR,
      subsidyActive: true,
      subsidyDiscountPercent: 10,
    });

    const discounted = await service.applyCleanAirSubsidy({
      quoteId: 'QUOTE-RIDE-01',
      baseFarePaise: 30000, // ₹300
      stationCode: 'AQI-APPCB-VJA-AUTONAGAR',
    });

    expect(discounted.originalFarePaise).toBe(30000);
    expect(discounted.discountPaise).toBe(3000); // 10% of ₹300 = ₹30
    expect(discounted.payableFarePaise).toBe(27000); // ₹270
    expect(discounted.municipalGrantCoveredPaise).toBe(3000);
  });

  it('should apply 0 discount when air quality is satisfactory (AQI <= 100)', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-aqi-id',
      stationCode: 'AQI-APPCB-AMV-SECRETARIAT',
      aqiLevel: AqiLevel.SATISFACTORY,
      subsidyActive: false,
      subsidyDiscountPercent: 0,
    });

    const discounted = await service.applyCleanAirSubsidy({
      quoteId: 'QUOTE-RIDE-02',
      baseFarePaise: 25000,
      stationCode: 'AQI-APPCB-AMV-SECRETARIAT',
    });

    expect(discounted.discountPaise).toBe(0);
    expect(discounted.payableFarePaise).toBe(25000);
    expect(discounted.municipalGrantCoveredPaise).toBe(0);
  });
});

