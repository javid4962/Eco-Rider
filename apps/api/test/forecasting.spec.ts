import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForecastingService } from '../src/modules/forecasting/forecasting.service';
import { ForecastingController } from '../src/modules/forecasting/forecasting.controller';
import { ZoneDemandForecast } from '../src/database/entities/zone-demand-forecast.entity';
import { FleetRepositioningOrder } from '../src/database/entities/fleet-repositioning-order.entity';

describe('ForecastingService (M38)', () => {
  let service: ForecastingService;
  let mockForecastRepo: any;
  let mockOrderRepo: any;

  beforeEach(async () => {
    mockForecastRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    mockOrderRepo = {
      create: jest.fn((e) => ({ ...e, id: 'ord-123', createdAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'ord-123' })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForecastingController],
      providers: [
        ForecastingService,
        { provide: getRepositoryToken(ZoneDemandForecast), useValue: mockForecastRepo },
        { provide: getRepositoryToken(FleetRepositioningOrder), useValue: mockOrderRepo },
      ],
    }).compile();

    service = module.get<ForecastingService>(ForecastingService);
  });

  it('should list seeded zone demand forecasts highlighting captain deficit and surge zones', async () => {
    const forecasts = await service.getZoneForecasts();
    expect(forecasts.length).toBeGreaterThanOrEqual(3);

    const amv = forecasts.find((f) => f.zoneId === 'zn-amv-sec');
    expect(amv).toBeDefined();
    expect(amv?.predictedDemandLevel).toBe('CRITICAL_SURGE');
    expect(amv?.deficitOrSurplusCaptains).toBeLessThan(0); // Deficit
    expect(amv?.recommendedRepositioningIncentivePaise).toBe(4000); // ₹40.00
  });

  it('should create repositioning order with financial incentive bonus', async () => {
    const order = await service.createRepositioningOrder({
      captainId: 'c0000000-0000-4000-8000-000000000001',
      originZoneName: 'Benz Circle',
      destinationZoneName: 'Velagapudi Secretariat',
      incentiveBonusPaise: 4000,
    });

    expect(order.orderNumber).toContain('REPO-');
    expect(order.incentiveBonusPaise).toBe(4000);
    expect(order.formattedBonus).toBe('₹40.00');
    expect(order.status).toBe('OFFERED');
    expect(mockOrderRepo.save).toHaveBeenCalled();
  });

  it('should accept repositioning order transition to ACCEPTED', async () => {
    const order = await service.acceptRepositioningOrder('REPO-TEST-001');
    expect(order.status).toBe('ACCEPTED');
  });
});

