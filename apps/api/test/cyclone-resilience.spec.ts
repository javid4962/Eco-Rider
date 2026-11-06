import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CycloneResilienceService } from '../src/modules/cyclone-resilience/cyclone-resilience.service';
import { CycloneRelocationPlan } from '../src/database/entities/cyclone-relocation-plan.entity';
import { CycloneSeverityAlert, FleetRelocationStatus } from '@ecoride/contracts';

describe('CycloneResilienceService (M80)', () => {
  let service: CycloneResilienceService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'plan-cyclone-01',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (p) => ({
        ...p,
        createdAt: p.createdAt || new Date(),
        updatedAt: new Date(),
      })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CycloneResilienceService,
        {
          provide: getRepositoryToken(CycloneRelocationPlan),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CycloneResilienceService>(CycloneResilienceService);
  });

  it('should generate an autonomous relocation plan during RED_EMERGENCY cyclone alert in coastal AP', async () => {
    const alert = {
      alertLevel: CycloneSeverityAlert.RED_EMERGENCY,
      cycloneName: 'Michaung',
      projectedWindSpeedKmph: 110,
      expectedRainfallMm: 220,
      surgeFloodRiskZones: ['BHAVANIPURAM_LOWLANDS'],
      safeElevatedStagingHubs: ['MANGALAGIRI_AIIMS_HIGH_GROUND'],
      effectiveUntil: '2026-11-06T12:00:00Z',
    };

    const relocate = {
      cycloneAlertId: 'alert-red-01',
      sourceFloodZone: 'BHAVANIPURAM_LOWLANDS',
      targetSafeStagingHub: 'MANGALAGIRI_AIIMS_HIGH_GROUND',
      vehicleIds: ['veh-01', 'veh-02', 'veh-03', 'veh-04'],
    };

    const plan = await service.createRelocationPlan(alert, relocate);

    expect(plan.alertLevel).toBe(CycloneSeverityAlert.RED_EMERGENCY);
    expect(plan.totalVehiclesTargeted).toBe(4);
    expect(plan.relocationStatus).toBe(FleetRelocationStatus.RELOCATION_DISPATCHED);
    expect(plan.elevationDeltaMeters).toBe(35.0);
  });

  it('should update staging progress and mark SAFE_STAGED once all vehicles are relocated', async () => {
    const activePlan = {
      id: 'plan-cyclone-01',
      totalVehiclesTargeted: 4,
      successfullyStagedCount: 2,
      alertLevel: CycloneSeverityAlert.RED_EMERGENCY,
      elevationDeltaMeters: 35.0,
      instructions: 'Relocation in progress',
      updatedAt: new Date(),
    };
    mockRepo.findOne.mockResolvedValue(activePlan);

    const progress = await service.updateStagingProgress('plan-cyclone-01', 2);

    expect(progress.successfullyStagedCount).toBe(4);
    expect(progress.relocationStatus).toBe(FleetRelocationStatus.SAFE_STAGED);
  });
});

