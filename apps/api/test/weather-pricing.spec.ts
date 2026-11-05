import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WeatherPricingService } from '../src/modules/weather-pricing/weather-pricing.service';
import { WeatherPricingController } from '../src/modules/weather-pricing/weather-pricing.controller';
import { WeatherConditionLog } from '../src/database/entities/weather-condition-log.entity';
import { ApWeatherAlertSeverity, WeatherEventType } from '@ecoride/contracts';

describe('WeatherPricingService (M50)', () => {
  let service: WeatherPricingService;
  let mockWeatherRepo: any;

  beforeEach(async () => {
    mockWeatherRepo = {
      findOne: jest.fn(),
      create: jest.fn((e) => ({ ...e, id: 'w-123' })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherPricingController],
      providers: [
        WeatherPricingService,
        { provide: getRepositoryToken(WeatherConditionLog), useValue: mockWeatherRepo },
      ],
    }).compile();

    service = module.get<WeatherPricingService>(WeatherPricingService);
  });

  it('should return 0 surcharge under NORMAL weather conditions', async () => {
    mockWeatherRepo.findOne.mockResolvedValueOnce(null); // Defaults to normal

    const fare = await service.calculateWeatherFare(10000, 'Benz Circle', 'Vijayawada'); // ₹100.00
    expect(fare.weatherHardshipSurchargePaise).toBe(0);
    expect(fare.totalPassengerFarePaise).toBe(10000);
    expect(fare.alertSeverity).toBe(ApWeatherAlertSeverity.NORMAL);
  });

  it('should apply 15% hardship surcharge under YELLOW_ALERT and pass 100% to captain with 0% platform skim', async () => {
    mockWeatherRepo.findOne.mockResolvedValueOnce({
      zone: 'Benz Circle',
      city: 'Vijayawada',
      eventType: WeatherEventType.HEATWAVE,
      severity: ApWeatherAlertSeverity.YELLOW_ALERT,
      ambientTemperatureCelsius: 41.5,
      precipitationMmPerHour: 0,
      windSpeedKmph: 15.0,
      isWeatherHardshipActive: true,
      driverAllowanceMultiplier: 1.15,
    });

    const fare = await service.calculateWeatherFare(20000, 'Benz Circle', 'Vijayawada'); // ₹200.00 base

    expect(fare.weatherHardshipSurchargePaise).toBe(3000); // 15% of ₹200 = ₹30.00 (3,000 paise)
    expect(fare.totalPassengerFarePaise).toBe(23000); // ₹230.00
    expect(fare.captainPassThroughAllowancePaise).toBe(3000); // 100% to driver
    expect(fare.platformCommissionOnSurchargePaise).toBe(0); // 0% platform commission
    expect(fare.advisoryNoteTelugu).toContain('తీవ్రమైన ఎండ / వర్షం హెచ్చరిక');
  });

  it('should apply 30% hardship surcharge under ORANGE_ALERT for torrential cyclone rains', async () => {
    mockWeatherRepo.findOne.mockResolvedValueOnce({
      zone: 'Brodipet',
      city: 'Guntur',
      eventType: WeatherEventType.CYCLONE_TORRENTIAL_RAIN,
      severity: ApWeatherAlertSeverity.ORANGE_ALERT,
      ambientTemperatureCelsius: 28.0,
      precipitationMmPerHour: 45.0,
      windSpeedKmph: 65.0,
      isWeatherHardshipActive: true,
      driverAllowanceMultiplier: 1.30,
    });

    const fare = await service.calculateWeatherFare(30000, 'Brodipet', 'Guntur'); // ₹300.00 base

    expect(fare.weatherHardshipSurchargePaise).toBe(9000); // 30% of ₹300 = ₹90.00 (9,000 paise)
    expect(fare.totalPassengerFarePaise).toBe(39000); // ₹390.00
    expect(fare.captainPassThroughAllowancePaise).toBe(9000);
  });
});

