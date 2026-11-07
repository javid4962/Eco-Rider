import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CellSwellingDiagnosticService } from '../src/modules/cell-swelling-diagnostic/cell-swelling-diagnostic.service';
import { CellSwellingDiagnosticController } from '../src/modules/cell-swelling-diagnostic/cell-swelling-diagnostic.controller';
import { CellDiagnosticGateLogEntity } from '../src/database/entities/cell-diagnostic-gate-log.entity';
import { CellDiagnosticHealth } from '@ecoride/contracts';

describe('CellSwellingDiagnosticModule', () => {
  let service: CellSwellingDiagnosticService;
  let controller: CellSwellingDiagnosticController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-diag-uuid',
      inspectedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-diag-uuid') {
        return {
          id: 'mock-diag-uuid',
          batteryPackSerial: 'PACK-NMC-2026-9912',
          diagnosticHealth: CellDiagnosticHealth.THERMAL_RUNAWAY_RISK,
          chargingAllowed: false,
          quarantineTriggered: true,
          fireSuppressionPreArmed: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CellSwellingDiagnosticController],
      providers: [
        CellSwellingDiagnosticService,
        {
          provide: getRepositoryToken(CellDiagnosticGateLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CellSwellingDiagnosticService>(CellSwellingDiagnosticService);
    controller = module.get<CellSwellingDiagnosticController>(CellSwellingDiagnosticController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should detect critical swelling and high surface temperature, tripping fire suppression and quarantine', async () => {
    const log = await controller.performDiagnostic({
      depotId: 'DEPOT-AMARAVATHI-01',
      bayNumber: 'DC-BAY-04',
      batteryPackSerial: 'PACK-NMC-2026-9912',
      vehicleId: 'EV-BUS-AP39-0199',
      measuredSwellingMm: 4.8, // Exceeds 4.5mm threshold
      internalGasPressureKPa: 220.0,
      cellSurfaceTemperatureC: 56.5, // Exceeds 55C
    });

    expect(log.diagnosticHealth).toBe(CellDiagnosticHealth.THERMAL_RUNAWAY_RISK);
    expect(log.chargingAllowed).toBe(false);
    expect(log.quarantineTriggered).toBe(true);
    expect(log.fireSuppressionPreArmed).toBe(true);
  });

  it('should approve charging when battery pack swelling is within normal manufacturing envelope', async () => {
    const log = await controller.performDiagnostic({
      depotId: 'DEPOT-AMARAVATHI-01',
      bayNumber: 'DC-BAY-02',
      batteryPackSerial: 'PACK-LFP-2026-1022',
      vehicleId: 'EV-CAB-AP37-0404',
      measuredSwellingMm: 1.2,
      internalGasPressureKPa: 95.0,
      cellSurfaceTemperatureC: 34.0,
    });

    expect(log.diagnosticHealth).toBe(CellDiagnosticHealth.NORMAL);
    expect(log.chargingAllowed).toBe(true);
    expect(log.quarantineTriggered).toBe(false);
  });
});

