import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GridPeakTariffService } from '../src/modules/grid-peak-tariff/grid-peak-tariff.service';
import { GridPeakTariffController } from '../src/modules/grid-peak-tariff/grid-peak-tariff.controller';
import { GridPeakTariffLogEntity } from '../src/database/entities/grid-peak-tariff-log.entity';
import { DiscomProvider, GridTariffPeriod } from '@ecoride/contracts';

describe('GridPeakTariffModule', () => {
  let service: GridPeakTariffService;
  let controller: GridPeakTariffController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-grid-tariff-uuid',
      evaluatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-grid-tariff-uuid') {
        return {
          id: 'mock-grid-tariff-uuid',
          tariffPeriod: GridTariffPeriod.PEAK_SURGE,
          isPeakSurgeActive: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GridPeakTariffController],
      providers: [
        GridPeakTariffService,
        {
          provide: getRepositoryToken(GridPeakTariffLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<GridPeakTariffService>(GridPeakTariffService);
    controller = module.get<GridPeakTariffController>(GridPeakTariffController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should enforce peak surge surcharge and corridor multiplier during evening peak hours (18:00 - 22:00)', async () => {
    const result = await controller.evaluate({
      depotId: 'DEPOT-AMARAVATHI-01',
      discom: DiscomProvider.APSPDCL,
      currentHourOfDay: 19, // 7:00 PM Peak
      activeChargerDrawKw: 650, // Heavy load
      baseTariffPaisePerKwh: 650, // ₹6.50/kWh baseline
    });

    expect(result.tariffPeriod).toBe(GridTariffPeriod.PEAK_SURGE);
    expect(result.isPeakSurgeActive).toBe(true);
    expect(result.peakSurchargePaisePerKwh).toBe(250);
    expect(result.effectiveRatePaisePerKwh).toBe(900); // ₹9.00/kWh
    expect(result.corridorSurgeMultiplier).toBe(1.35);
    expect(result.throttleAdvisory).toContain('CRITICAL_GRID_PEAK');
  });

  it('should grant solar super off-peak incentive during midday solar window (11:00 - 16:00)', async () => {
    const result = await controller.evaluate({
      depotId: 'DEPOT-GUNTUR-02',
      discom: DiscomProvider.APSPDCL,
      currentHourOfDay: 13, // 1:00 PM
      activeChargerDrawKw: 200,
      baseTariffPaisePerKwh: 650,
    });

    expect(result.tariffPeriod).toBe(GridTariffPeriod.SOLAR_SUPER_OFF_PEAK);
    expect(result.isPeakSurgeActive).toBe(false);
    expect(result.peakSurchargePaisePerKwh).toBe(-150);
    expect(result.effectiveRatePaisePerKwh).toBe(500); // ₹5.00/kWh discounted
    expect(result.corridorSurgeMultiplier).toBe(1.0);
  });
});

