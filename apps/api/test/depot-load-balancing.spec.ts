import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DepotLoadBalancingService } from '../src/modules/depot-load-balancing/depot-load-balancing.service';
import { DepotPowerAllocation } from '../src/database/entities/depot-power-allocation.entity';

describe('DepotLoadBalancingService (Milestone M68)', () => {
  let service: DepotLoadBalancingService;

  const mockAllocations: any[] = [];

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      id: `alloc-${Date.now()}`,
      ...dto,
      calculatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((a) => {
      mockAllocations.push(a);
      return Promise.resolve(a);
    }),
  };

  beforeEach(async () => {
    mockAllocations.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepotLoadBalancingService,
        { provide: getRepositoryToken(DepotPowerAllocation), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DepotLoadBalancingService>(DepotLoadBalancingService);
  });

  it('should return 0 load when no vehicles are connected', async () => {
    const res = await service.balanceDepotLoad({
      depotId: '00000000-0000-0000-0000-000000000001',
      maxTransformerCapacityKw: 500,
      vehicles: [],
    });

    expect(res.currentTotalDrawKw).toBe(0);
    expect(res.utilizationPercentage).toBe(0);
    expect(res.loadSheddingActive).toBe(false);
  });

  it('should allocate full charging power when demand is within capacity', async () => {
    const res = await service.balanceDepotLoad({
      depotId: '00000000-0000-0000-0000-000000000001',
      maxTransformerCapacityKw: 300,
      vehicles: [
        {
          gunId: 'GUN-01',
          vehicleRegistrationNumber: 'AP-16-EV-1111',
          currentSocPercent: 40,
          targetSocPercent: 90,
          batteryCapacityKwh: 40,
          departureScheduledAt: '2026-11-10T18:00:00.000Z',
        },
        {
          gunId: 'GUN-02',
          vehicleRegistrationNumber: 'AP-16-EV-2222',
          currentSocPercent: 50,
          targetSocPercent: 90,
          batteryCapacityKwh: 40,
          departureScheduledAt: '2026-11-10T19:00:00.000Z',
        },
      ],
    });

    expect(res.activeVehiclesCount).toBe(2);
    expect(res.loadSheddingActive).toBe(false);
    expect(res.currentTotalDrawKw).toBe(120); // 2 * 60 kW
    expect(res.utilizationPercentage).toBe(40.0);
  });

  it('should activate load shedding when total demand exceeds transformer capacity', async () => {
    // 5 vehicles * 60 kW = 300 kW demand, but transformer limit is 150 kW
    const vehicles = [1, 2, 3, 4, 5].map((i) => ({
      gunId: `GUN-0${i}`,
      vehicleRegistrationNumber: `AP-16-EV-000${i}`,
      currentSocPercent: 30,
      targetSocPercent: 90,
      batteryCapacityKwh: 40,
      departureScheduledAt: '2026-11-10T17:00:00.000Z',
    }));

    const res = await service.balanceDepotLoad({
      depotId: '00000000-0000-0000-0000-000000000001',
      maxTransformerCapacityKw: 150,
      vehicles,
    });

    expect(res.loadSheddingActive).toBe(true);
    expect(res.currentTotalDrawKw).toBeLessThanOrEqual(150.1);
    expect(res.allocations[0].assignedPowerKw).toBeLessThan(60);
  });

  it('should throw BadRequestException if transformer capacity is <= 0', async () => {
    await expect(
      service.balanceDepotLoad({
        depotId: '00000000-0000-0000-0000-000000000001',
        maxTransformerCapacityKw: 0,
        vehicles: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

