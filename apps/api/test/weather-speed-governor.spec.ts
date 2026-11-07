import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WeatherSpeedGovernorService } from '../src/modules/weather-speed-governor/weather-speed-governor.service';
import { WeatherSpeedGovernorController } from '../src/modules/weather-speed-governor/weather-speed-governor.controller';
import { WeatherGovernorEventEntity } from '../src/database/entities/weather-governor-event.entity';

describe('WeatherSpeedGovernorModule', () => {
  let service: WeatherSpeedGovernorService;
  let controller: WeatherSpeedGovernorController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-weather-uuid',
      effectiveFrom: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherSpeedGovernorController],
      providers: [
        WeatherSpeedGovernorService,
        {
          provide: getRepositoryToken(WeatherGovernorEventEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<WeatherSpeedGovernorService>(WeatherSpeedGovernorService);
    controller = module.get<WeatherSpeedGovernorController>(WeatherSpeedGovernorController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should enforce 50 km/h speed governor on NH-16 during severe monsoon precipitation', async () => {
    const directive = await controller.updateCorridorWeather({
      corridorId: 'NH-16-BZA-GNT',
      corridorName: 'NH-16 Vijayawada-Guntur Express Corridor',
      precipitationMmPerHr: 45.0,
      visibilityMeters: 180.0,
      roadSurfaceCondition: 'WATERLOGGED',
      severity: 'HEAVY_MONSOON',
    });

    expect(directive.governorActive).toBe(true);
    expect(directive.recommendedSpeedLimitKmph).toBe(50);
    expect(directive.standardSpeedLimitKmph).toBe(80);
    expect(directive.reason).toContain('Severe monsoon rain');
  });

  it('should maintain standard 80 km/h speed limit during clear weather conditions', async () => {
    const directive = await controller.updateCorridorWeather({
      corridorId: 'NH-16-BZA-GNT',
      corridorName: 'NH-16 Vijayawada-Guntur Express Corridor',
      precipitationMmPerHr: 0.0,
      visibilityMeters: 2500.0,
      roadSurfaceCondition: 'DRY',
      severity: 'CLEAR',
    });

    expect(directive.governorActive).toBe(false);
    expect(directive.recommendedSpeedLimitKmph).toBe(80);
  });
});
