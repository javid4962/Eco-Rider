import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SolarMpptCouplingService } from '../src/modules/solar-mppt-coupling/solar-mppt-coupling.service';
import { SolarMpptCouplingController } from '../src/modules/solar-mppt-coupling/solar-mppt-coupling.controller';
import { SolarMpptCouplingSessionEntity } from '../src/database/entities/solar-mppt-coupling-session.entity';
import { MpptCouplingMode } from '@ecoride/contracts';

describe('SolarMpptCouplingModule', () => {
  let service: SolarMpptCouplingService;
  let controller: SolarMpptCouplingController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-solar-uuid',
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-solar-uuid') {
        return {
          id: 'mock-solar-uuid',
          depotId: 'DEPOT-AMARAVATHI-01',
          couplingMode: MpptCouplingMode.DIRECT_SOLAR_DC,
          solarPowerKw: 120.0,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolarMpptCouplingController],
      providers: [
        SolarMpptCouplingService,
        {
          provide: getRepositoryToken(SolarMpptCouplingSessionEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<SolarMpptCouplingService>(SolarMpptCouplingService);
    controller = module.get<SolarMpptCouplingController>(SolarMpptCouplingController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should deliver direct DC solar power when PV generation matches vehicle charging demand', async () => {
    const session = await controller.logTelemetry({
      depotId: 'DEPOT-AMARAVATHI-01',
      pvArrayId: 'PV-ROOFTOP-ARRAY-01',
      chargerGunId: 'GUN-DC-350KW-01',
      vehicleId: 'EV-BUS-AP39-0101',
      solarIrradianceWPerM2: 950.0,
      mpptDcBusVoltageVolts: 750.0,
      solarDcCurrentAmps: 160.0, // 120 kW solar
      vehicleDemandKw: 100.0,
    });

    expect(session.couplingMode).toBe(MpptCouplingMode.DIRECT_SOLAR_DC);
    expect(session.solarPowerKw).toBe(120.0);
    expect(session.gridPowerImportKw).toBe(0.0);
    expect(session.avoidedAcDcLossKwh).toBeGreaterThan(0);
  });

  it('should supplement from grid when solar generation is insufficient', async () => {
    const session = await controller.logTelemetry({
      depotId: 'DEPOT-AMARAVATHI-01',
      pvArrayId: 'PV-ROOFTOP-ARRAY-01',
      chargerGunId: 'GUN-DC-350KW-02',
      vehicleId: 'EV-BUS-AP39-0102',
      solarIrradianceWPerM2: 400.0,
      mpptDcBusVoltageVolts: 700.0,
      solarDcCurrentAmps: 50.0, // 35 kW solar
      vehicleDemandKw: 100.0,
    });

    expect(session.couplingMode).toBe(MpptCouplingMode.GRID_SUPPLEMENTED);
    expect(session.solarPowerKw).toBe(35.0);
    expect(session.gridPowerImportKw).toBe(65.0);
  });
});
