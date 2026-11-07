import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SolarDepotMicrogridService } from '../src/modules/solar-depot-microgrid/solar-depot-microgrid.service';
import { SolarDepotMicrogridController } from '../src/modules/solar-depot-microgrid/solar-depot-microgrid.controller';
import { SolarDepotMicrogridEventEntity } from '../src/database/entities/solar-depot-microgrid-event.entity';

describe('SolarDepotMicrogridModule', () => {
  let service: SolarDepotMicrogridService;
  let controller: SolarDepotMicrogridController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-microgrid-uuid',
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolarDepotMicrogridController],
      providers: [
        SolarDepotMicrogridService,
        {
          provide: getRepositoryToken(SolarDepotMicrogridEventEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<SolarDepotMicrogridService>(SolarDepotMicrogridService);
    controller = module.get<SolarDepotMicrogridController>(SolarDepotMicrogridController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should trigger peak shaving arbitrage during high grid tariff', async () => {
    const result = await controller.dispatchPeakShaving({
      depotId: 'DEPOT-BENZ-CIRCLE',
      solarGenerationKw: 40,
      depotBessSocPct: 80,
      gridDemandTariffPaisePerKwh: 950, // Peak tariff 950 paise
      totalChargingLoadKw: 50,
    });

    expect(['SOLAR_BESS', 'HYBRID']).toContain(result.sourceMode);
    expect(result.peakShavedKw).toBeGreaterThan(0);
    expect(result.arbitrageSavingsPaise).toBeGreaterThan(0);
    expect(result.isPeakPeriod).toBe(true);
  });

  it('should rely purely on grid if off-peak tariff is low', async () => {
    const result = await service.dispatchPeakShaving({
      depotId: 'DEPOT-AUTONAGAR',
      solarGenerationKw: 10,
      depotBessSocPct: 50,
      gridDemandTariffPaisePerKwh: 450, // Off peak tariff
      totalChargingLoadKw: 30,
    });

    expect(result.sourceMode).toBe('GRID');
    expect(result.peakShavedKw).toBe(0);
    expect(result.isPeakPeriod).toBe(false);
  });
});
