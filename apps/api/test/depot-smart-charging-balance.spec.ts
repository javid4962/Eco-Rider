import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepotSmartChargingBalanceService } from '../src/modules/depot-smart-charging-balance/depot-smart-charging-balance.service';
import { DepotSmartChargingBalanceController } from '../src/modules/depot-smart-charging-balance/depot-smart-charging-balance.controller';
import { DepotSmartChargingPlanEntity } from '../src/database/entities/depot-smart-charging-plan.entity';

describe('DepotSmartChargingBalanceModule', () => {
  let service: DepotSmartChargingBalanceService;
  let controller: DepotSmartChargingBalanceController;

  const mockPlan: Partial<DepotSmartChargingPlanEntity> = {
    id: 'mock-plan-uuid',
    depotId: 'DEPOT-GUNTUR-CENTRAL',
    totalAllocatedKw: 120,
    availableCapacityKw: 150,
    unmetDemandKw: 0,
    allocationsJson: JSON.stringify([
      { vehicleId: 'EV-CAB-01', allocatedKw: 22, priorityScore: 8.5, estimatedFullChargeAt: new Date().toISOString() },
    ]),
    calculatedAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-plan-uuid',
      calculatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { depotId } }) => {
      if (depotId === 'DEPOT-GUNTUR-CENTRAL') {
        return mockPlan;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepotSmartChargingBalanceController],
      providers: [
        DepotSmartChargingBalanceService,
        {
          provide: getRepositoryToken(DepotSmartChargingPlanEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DepotSmartChargingBalanceService>(DepotSmartChargingBalanceService);
    controller = module.get<DepotSmartChargingBalanceController>(DepotSmartChargingBalanceController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should compute balanced AC power distribution across fleet vehicles without exceeding transformer capacity', async () => {
    const tomorrowMorning = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    const result = await controller.computeChargingBalance({
      depotId: 'DEPOT-GUNTUR-CENTRAL',
      totalAvailableAcKw: 100,
      vehicles: [
        {
          vehicleId: 'EV-AUTO-01',
          currentSocPct: 20,
          targetSocPct: 90,
          batteryCapacityKwh: 12,
          departureDeadline: tomorrowMorning,
        },
        {
          vehicleId: 'EV-CAB-02',
          currentSocPct: 15,
          targetSocPct: 95,
          batteryCapacityKwh: 45,
          departureDeadline: tomorrowMorning,
        },
      ],
    });

    expect(result.allocations.length).toBe(2);
    expect(result.totalAllocatedKw).toBeLessThanOrEqual(100);
    expect(result.allocations[0].allocatedKw).toBeGreaterThan(0);
  });

  it('should fetch latest smart charging plan for depot', async () => {
    const plan = await controller.getDepotLatestPlan('DEPOT-GUNTUR-CENTRAL');
    expect(plan.depotId).toBe('DEPOT-GUNTUR-CENTRAL');
    expect(plan.allocations.length).toBe(1);
  });
});
