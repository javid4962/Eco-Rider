import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FleetRebalancingDispatchService } from '../src/modules/fleet-rebalancing-dispatch/fleet-rebalancing-dispatch.service';
import { FleetRebalancingDispatchController } from '../src/modules/fleet-rebalancing-dispatch/fleet-rebalancing-dispatch.controller';
import { MultiDistrictRebalancingOrderEntity } from '../src/database/entities/multi-district-rebalancing-order.entity';

describe('FleetRebalancingDispatchModule', () => {
  let service: FleetRebalancingDispatchService;
  let controller: FleetRebalancingDispatchController;

  const mockOrder: Partial<MultiDistrictRebalancingOrderEntity> = {
    id: 'ORDER-REBAL-01',
    orderNumber: 'REBAL-20261107-XYZ',
    sourceDistrict: 'GUNTUR',
    targetDistrict: 'VIJAYAWADA',
    targetZoneId: 'ZONE-BZA-RAILWAY',
    bountyPaise: 8000,
    status: 'OPEN',
    expiresAt: new Date(Date.now() + 3600 * 1000),
    createdAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'ORDER-REBAL-01',
      createdAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'ORDER-REBAL-01') {
        return { ...mockOrder };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FleetRebalancingDispatchController],
      providers: [
        FleetRebalancingDispatchService,
        {
          provide: getRepositoryToken(MultiDistrictRebalancingOrderEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FleetRebalancingDispatchService>(FleetRebalancingDispatchService);
    controller = module.get<FleetRebalancingDispatchController>(FleetRebalancingDispatchController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should generate rebalancing orders with ₹80 (8000 paise) bounty for deficit zones', async () => {
    const orders = await controller.generateRebalancingOrders([
      {
        zoneId: 'ZONE-BZA-RAILWAY',
        district: 'VIJAYAWADA',
        currentActiveVehicles: 5,
        projectedDemandTrips: 20,
        deficitVehicles: 15,
      },
    ]);

    expect(orders.length).toBe(1);
    expect(orders[0].bountyPaise).toBe(8000);
    expect(orders[0].status).toBe('OPEN');
    expect(orders[0].targetDistrict).toBe('VIJAYAWADA');
  });

  it('should transition order to ACCEPTED when captain accepts repositioning trip', async () => {
    const order = await controller.acceptOrder('ORDER-REBAL-01', {
      captainId: 'CAP-007',
      vehicleId: 'EV-3W-009',
    });

    expect(order.status).toBe('ACCEPTED');
    expect(order.captainId).toBe('CAP-007');
  });

  it('should complete repositioning order and timestamp arrival', async () => {
    // Set status to ACCEPTED first in mock
    mockOrder.status = 'ACCEPTED';
    const completed = await controller.completeOrder('ORDER-REBAL-01');

    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBeDefined();
  });
});
