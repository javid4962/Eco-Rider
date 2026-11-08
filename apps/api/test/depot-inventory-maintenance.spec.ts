import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DepotInventoryMaintenanceService } from '../src/modules/depot-inventory-maintenance/depot-inventory-maintenance.service';
import { DepotInventoryMaintenanceController } from '../src/modules/depot-inventory-maintenance/depot-inventory-maintenance.controller';
import { DepotMaintenanceWorkOrderEntity } from '../src/database/entities/depot-maintenance-work-order.entity';
import { DepotWorkOrderStatus, SparePartCategory } from '@ecoride/contracts';

describe('DepotInventoryMaintenanceModule', () => {
  let service: DepotInventoryMaintenanceService;
  let controller: DepotInventoryMaintenanceController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-work-order-uuid',
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-work-order-uuid') {
        return {
          id: 'mock-work-order-uuid',
          status: DepotWorkOrderStatus.SCHEDULED,
          partCategory: SparePartCategory.HV_CONTACTOR,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepotInventoryMaintenanceController],
      providers: [
        DepotInventoryMaintenanceService,
        {
          provide: getRepositoryToken(DepotMaintenanceWorkOrderEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DepotInventoryMaintenanceService>(DepotInventoryMaintenanceService);
    controller = module.get<DepotInventoryMaintenanceController>(DepotInventoryMaintenanceController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should successfully schedule preventive work order and reserve parts when inventory is available', async () => {
    const order = await controller.createWorkOrder({
      depotId: 'DEPOT-AMARAVATHI-01',
      vehicleId: 'EV-4W-CAB-9921',
      partCategory: SparePartCategory.HV_CONTACTOR,
      odometerKm: 45200.0,
      regenCyclesCount: 3200,
      availableStockUnits: 8,
    });

    expect(order.status).toBe(DepotWorkOrderStatus.SCHEDULED);
    expect(order.partCategory).toBe(SparePartCategory.HV_CONTACTOR);
    expect(order.partsReservedUnits).toBe(1);
    expect(order.estimatedLaborMinutes).toBe(120);
    expect(order.preventiveAlertIssued).toBe(true);
  });

  it('should flag parts shortage status when depot spare inventory is depleted', async () => {
    const order = await controller.createWorkOrder({
      depotId: 'DEPOT-AMARAVATHI-01',
      vehicleId: 'EV-4W-CAB-9921',
      partCategory: SparePartCategory.REGEN_BRAKE_PAD,
      odometerKm: 48000.0,
      regenCyclesCount: 4100,
      availableStockUnits: 0, // Depleted!
    });

    expect(order.status).toBe(DepotWorkOrderStatus.PARTS_SHORTAGE);
    expect(order.partsReservedUnits).toBe(0);
    expect(order.estimatedLaborMinutes).toBe(45);
  });
});
