import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegenHarvestTelemetryService } from '../src/modules/regen-harvest-telemetry/regen-harvest-telemetry.service';
import { RegenHarvestTelemetryController } from '../src/modules/regen-harvest-telemetry/regen-harvest-telemetry.controller';
import { RegenHarvestLogEntity } from '../src/database/entities/regen-harvest-log.entity';
import { RegenStatus } from '@ecoride/contracts';

describe('RegenHarvestTelemetryModule', () => {
  let service: RegenHarvestTelemetryService;
  let controller: RegenHarvestTelemetryController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-regen-uuid',
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-regen-uuid') {
        return {
          id: 'mock-regen-uuid',
          vehicleId: 'EV-3W-BZA-404',
          regenStatus: RegenStatus.OPTIMAL,
          energyRecuperatedWattHours: 120.5,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegenHarvestTelemetryController],
      providers: [
        RegenHarvestTelemetryService,
        {
          provide: getRepositoryToken(RegenHarvestLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<RegenHarvestTelemetryService>(RegenHarvestTelemetryService);
    controller = module.get<RegenHarvestTelemetryController>(RegenHarvestTelemetryController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should harvest energy on steep downhill slope under normal battery conditions', async () => {
    const log = await controller.ingest({
      vehicleId: 'EV-3W-BZA-404',
      tripId: 'TRIP-GHAT-01',
      corridorSegment: 'Mangalagiri Temple Hill Ghat Road',
      slopeGradePercent: 8.5,
      descentDistanceMeters: 1200,
      entrySpeedKmh: 35.0,
      exitSpeedKmh: 28.0,
      packSocPercent: 62.0,
      cellMaxTemperatureC: 38.5,
    });

    expect(log.regenStatus).toBe(RegenStatus.OPTIMAL);
    expect(log.regenTorqueNm).toBe(90.0);
    expect(log.energyRecuperatedWattHours).toBeGreaterThan(0);
  });

  it('should cutoff regen braking when pack SoC is near 100% to prevent cell overcharge', async () => {
    const log = await controller.ingest({
      vehicleId: 'EV-3W-BZA-404',
      tripId: 'TRIP-GHAT-02',
      corridorSegment: 'Kondapalli Hill Descent',
      slopeGradePercent: 7.2,
      descentDistanceMeters: 800,
      entrySpeedKmh: 30.0,
      exitSpeedKmh: 25.0,
      packSocPercent: 99.0, // High SoC
      cellMaxTemperatureC: 40.0,
    });

    expect(log.regenStatus).toBe(RegenStatus.CUTOFF_FULL_CHARGE);
    expect(log.regenTorqueNm).toBe(0.0);
    expect(log.energyRecuperatedWattHours).toBe(0.0);
  });
});
