import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FleetSubLeaseService } from '../src/modules/fleet-sub-lease/fleet-sub-lease.service';
import { FleetSubLeaseController } from '../src/modules/fleet-sub-lease/fleet-sub-lease.controller';
import { FleetSubLeaseSettlementEntity } from '../src/database/entities/fleet-sub-lease-settlement.entity';

describe('FleetSubLeaseModule', () => {
  let service: FleetSubLeaseService;
  let controller: FleetSubLeaseController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-sublease-uuid',
      settledAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-sublease-uuid') {
        return {
          id: 'mock-sublease-uuid',
          isBalanced: true,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FleetSubLeaseController],
      providers: [
        FleetSubLeaseService,
        {
          provide: getRepositoryToken(FleetSubLeaseSettlementEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FleetSubLeaseService>(FleetSubLeaseService);
    controller = module.get<FleetSubLeaseController>(FleetSubLeaseController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should accurately split net distributable fare across captain, fleet owner, and battery lessor in balanced integer paise', async () => {
    const settlement = await controller.settle({
      contractId: 'CONTRACT-SUBLEASE-2026-AP01',
      vehicleId: 'EV-3W-AP39-8811',
      captainId: 'CAPTAIN-001',
      fleetOwnerId: 'FLEET-OWNER-VIJAYAWADA',
      batteryAssetCoId: 'BATTERY-ASSETCO-HYD',
      grossFarePaise: 100000, // ₹1,000.00
      platformFeePaise: 20000, // ₹200.00
    });

    expect(settlement.netDistributablePaise).toBe(80000); // ₹800.00
    expect(settlement.captainSharePaise).toBe(40000); // 50% = ₹400.00
    expect(settlement.fleetOwnerSharePaise).toBe(24000); // 30% = ₹240.00
    expect(settlement.batteryAssetCoSharePaise).toBe(16000); // 20% = ₹160.00
    expect(settlement.isBalanced).toBe(true);
    expect(
      settlement.captainSharePaise +
        settlement.fleetOwnerSharePaise +
        settlement.batteryAssetCoSharePaise,
    ).toBe(settlement.netDistributablePaise);
  });

  it('should reject settlement if gross fare does not exceed platform fee', async () => {
    await expect(
      controller.settle({
        contractId: 'CONTRACT-SUBLEASE-2026-AP01',
        vehicleId: 'EV-3W-AP39-8811',
        captainId: 'CAPTAIN-001',
        fleetOwnerId: 'FLEET-OWNER-VIJAYAWADA',
        batteryAssetCoId: 'BATTERY-ASSETCO-HYD',
        grossFarePaise: 15000,
        platformFeePaise: 20000,
      }),
    ).rejects.toThrow('Gross fare must exceed platform fee');
  });
});
