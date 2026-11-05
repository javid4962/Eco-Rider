import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FleetMaintenanceService } from '../src/modules/fleet-maintenance/fleet-maintenance.service';
import { FleetMaintenanceOrder } from '../src/database/entities/fleet-maintenance-order.entity';
import { MaintenanceType, WorkOrderStatus } from '@ecoride/contracts';

describe('FleetMaintenanceService (Milestone M58)', () => {
  let service: FleetMaintenanceService;

  const mockOrders: any[] = [];

  const mockRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockOrders.find((o) => {
        if (where.orderNumber && o.orderNumber !== where.orderNumber) return false;
        return true;
      });
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `ord-${Date.now()}`,
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((order) => {
      const idx = mockOrders.findIndex((o) => o.orderNumber === order.orderNumber);
      if (idx >= 0) {
        mockOrders[idx] = order;
      } else {
        mockOrders.push(order);
      }
      return Promise.resolve(order);
    }),
  };

  beforeEach(async () => {
    mockOrders.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FleetMaintenanceService,
        { provide: getRepositoryToken(FleetMaintenanceOrder), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FleetMaintenanceService>(FleetMaintenanceService);
  });

  it('should detect when vehicle maintenance is due by odometer', () => {
    const dueCheck = service.checkVehicleMaintenanceDue(52000, 41000); // 11,000 km diff
    expect(dueCheck.isDue).toBe(true);
    expect(dueCheck.reason).toContain('11000 km since last service');

    const notDueCheck = service.checkVehicleMaintenanceDue(45000, 41000); // 4,000 km diff
    expect(notDueCheck.isDue).toBe(false);
  });

  it('should create a scheduled maintenance order with estimated cost', async () => {
    const order = await service.createOrder({
      vehicleRegistrationNumber: 'AP-16-EV-9999',
      serviceType: MaintenanceType.BRAKE_PAD_REPLACEMENT,
      depotId: '00000000-0000-0000-0000-000000000001',
      currentOdometerKm: 35000,
      triggerReason: 'Brake regenerative wear threshold reached',
      scheduledDate: '2026-11-10',
    });

    expect(order).toBeDefined();
    expect(order.vehicleRegistrationNumber).toBe('AP-16-EV-9999');
    expect(order.serviceType).toBe(MaintenanceType.BRAKE_PAD_REPLACEMENT);
    expect(order.estimatedCostPaise).toBe(220000); // ₹2,200.00
    expect(order.status).toBe(WorkOrderStatus.SCHEDULED);
  });

  it('should complete work order and update actual cost', async () => {
    const order = await service.createOrder({
      vehicleRegistrationNumber: 'AP-07-EV-1234',
      serviceType: MaintenanceType.ROUTINE_SCHEDULED_SERVICE,
      depotId: '00000000-0000-0000-0000-000000000002',
      currentOdometerKm: 20000,
      triggerReason: '20,000 km routine service',
      scheduledDate: '2026-11-12',
    });

    const completed = await service.completeOrder(order.orderNumber, 145000); // ₹1,450.00
    expect(completed.status).toBe(WorkOrderStatus.COMPLETED);
    expect(completed.actualCostPaise).toBe(145000);
    expect(completed.completedAt).toBeDefined();
  });

  it('should reject invalid actual cost or missing order', async () => {
    await expect(service.completeOrder('WO-NONEXISTENT', 1000)).rejects.toThrow(NotFoundException);
    await expect(service.completeOrder('WO-ANY', -500)).rejects.toThrow(BadRequestException);
  });
});

