import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { DepotsService } from '../src/modules/depots/depots.service';
import { DepotsController } from '../src/modules/depots/depots.controller';
import { FleetDepot } from '../src/database/entities/fleet-depot.entity';
import { DepotBayAllocation } from '../src/database/entities/depot-bay-allocation.entity';
import { Vehicle } from '../src/database/entities/vehicle.entity';

describe('Institutional & Municipal Fleet Depots (M29)', () => {
  let service: DepotsService;

  const mockDepots: FleetDepot[] = [
    {
      id: 'depot-1',
      name: 'AP State Secretariat EV Fleet Depot',
      code: 'DEP-SEC-01',
      city: 'Amaravathi',
      address: 'Velagapudi Complex, Amaravathi',
      latitude: 16.5415,
      longitude: 80.5155,
      totalParkingBays: 60,
      availableParkingBays: 2,
      totalChargingGuns: 24,
      availableChargingGuns: 1,
      isGovernmentAuthorized: true,
      securityContact: '+91 866 242 8111',
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'depot-2',
      name: 'PNBS Fleet Depot',
      code: 'DEP-PNBS-01',
      city: 'Vijayawada',
      address: 'PNBS, Vijayawada',
      latitude: 16.508,
      longitude: 80.612,
      totalParkingBays: 100,
      availableParkingBays: 50,
      totalChargingGuns: 40,
      availableChargingGuns: 20,
      isGovernmentAuthorized: true,
      securityContact: '+91 866 242 8222',
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const mockVehicles: Partial<Vehicle>[] = [
    { id: 'veh-1', registrationNumber: 'AP 16 EV 1001', isActive: true },
    { id: 'veh-2', registrationNumber: 'AP 16 EV 1002', isActive: true },
  ];

  const mockAllocations: DepotBayAllocation[] = [];

  const mockDepotRepo = {
    find: jest.fn().mockResolvedValue(mockDepots),
    findOne: jest.fn(({ where }) => {
      const match = mockDepots.find((d) => d.id === where.id);
      return Promise.resolve(match || null);
    }),
    create: jest.fn((dto) => ({ id: `dep-${Math.random()}`, ...dto })),
    save: jest.fn((entityOrEntities) => Promise.resolve(entityOrEntities)),
  };

  const mockAllocationRepo = {
    findOne: jest.fn(({ where }) => {
      const match = mockAllocations.find((a) => a.id === where.id);
      return Promise.resolve(match || null);
    }),
  };

  const mockVehicleRepo = {
    findOne: jest.fn(({ where }) => {
      const match = mockVehicles.find((v) => v.id === where.id);
      return Promise.resolve(match || null);
    }),
  };

  const mockEntityManager = {
    create: jest.fn((_entityClass, dto) => ({
      id: `alloc-uuid-${Math.random()}`,
      createdAt: new Date(),
      ...dto,
    })),
    save: jest.fn((_entityClassOrEntities, maybeEntities) => {
      const toSave = maybeEntities || _entityClassOrEntities;
      if (toSave.bayNumber) {
        mockAllocations.push(toSave);
      }
      return Promise.resolve(toSave);
    }),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    mockAllocations.length = 0;
    mockDepots[0].availableParkingBays = 2;
    mockDepots[0].availableChargingGuns = 1;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepotsController],
      providers: [
        DepotsService,
        { provide: getRepositoryToken(FleetDepot), useValue: mockDepotRepo },
        { provide: getRepositoryToken(DepotBayAllocation), useValue: mockAllocationRepo },
        { provide: getRepositoryToken(Vehicle), useValue: mockVehicleRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<DepotsService>(DepotsService);
  });

  describe('Depot Directory & Capacity', () => {
    it('should list all authorized AP fleet depots', async () => {
      const depots = await service.listDepots();
      expect(depots.length).toBe(2);
      expect(depots[0].code).toBe('DEP-SEC-01');
      expect(depots[0].isGovernmentAuthorized).toBe(true);
    });

    it('should filter depots by city', async () => {
      const amaravathiDepots = await service.listDepots('Amaravathi');
      expect(amaravathiDepots.length).toBe(1);
      expect(amaravathiDepots[0].city).toBe('Amaravathi');

      const vjaDepots = await service.listDepots('Vijayawada');
      expect(vjaDepots.length).toBe(1);
      expect(vjaDepots[0].city).toBe('Vijayawada');
    });
  });

  describe('Depot Bay Allocation & Reservation', () => {
    it('should allocate an overnight parking bay successfully', async () => {
      const alloc = await service.allocateBay({
        depotId: 'depot-1',
        vehicleId: 'veh-1',
        purpose: 'OVERNIGHT_PARKING',
        hoursDuration: 10,
      });

      expect(alloc.depotId).toBe('depot-1');
      expect(alloc.vehiclePlate).toBe('AP 16 EV 1001');
      expect(alloc.purpose).toBe('OVERNIGHT_PARKING');
      expect(alloc.status).toBe('ACTIVE');
      expect(alloc.bayNumber).toContain('BAY-DEP-SEC-01-');
      expect(mockDepots[0].availableParkingBays).toBe(1);
    });

    it('should allocate charging bay and decrement both parking bays and charging guns', async () => {
      const alloc = await service.allocateBay({
        depotId: 'depot-1',
        vehicleId: 'veh-2',
        purpose: 'CHARGING',
        hoursDuration: 4,
      });

      expect(alloc.purpose).toBe('CHARGING');
      expect(mockDepots[0].availableParkingBays).toBe(1);
      expect(mockDepots[0].availableChargingGuns).toBe(0);
    });

    it('should reject charging allocation when charging guns are exhausted', async () => {
      mockDepots[0].availableChargingGuns = 0;

      await expect(
        service.allocateBay({
          depotId: 'depot-1',
          vehicleId: 'veh-1',
          purpose: 'CHARGING',
          hoursDuration: 4,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject allocation when parking bays are exhausted', async () => {
      mockDepots[0].availableParkingBays = 0;

      await expect(
        service.allocateBay({
          depotId: 'depot-1',
          vehicleId: 'veh-1',
          purpose: 'OVERNIGHT_PARKING',
          hoursDuration: 4,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should release an allocated bay and increment depot available count', async () => {
      const alloc = await service.allocateBay({
        depotId: 'depot-1',
        vehicleId: 'veh-1',
        purpose: 'CHARGING',
        hoursDuration: 4,
      });

      const released = await service.releaseBay(alloc.id);
      expect(released.status).toBe('RELEASED');
      expect(mockDepots[0].availableParkingBays).toBe(2);
      expect(mockDepots[0].availableChargingGuns).toBe(1);
    });

    it('should reject releasing an already released bay', async () => {
      const alloc = await service.allocateBay({
        depotId: 'depot-1',
        vehicleId: 'veh-1',
        purpose: 'OVERNIGHT_PARKING',
        hoursDuration: 4,
      });

      await service.releaseBay(alloc.id);

      await expect(
        service.releaseBay(alloc.id),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
