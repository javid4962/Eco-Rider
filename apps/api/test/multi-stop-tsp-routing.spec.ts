import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MultiStopTspRoutingService } from '../src/modules/multi-stop-tsp-routing/multi-stop-tsp-routing.service';
import { MultiStopTspRoutingController } from '../src/modules/multi-stop-tsp-routing/multi-stop-tsp-routing.controller';
import { MultiStopTspRouteEntity } from '../src/database/entities/multi-stop-tsp-route.entity';

describe('MultiStopTspRoutingModule', () => {
  let service: MultiStopTspRoutingService;
  let controller: MultiStopTspRoutingController;

  const mockRoute: Partial<MultiStopTspRouteEntity> = {
    id: 'mock-tsp-uuid',
    routeId: 'TSP-BZA-LOGISTICS-01',
    vehicleId: 'EV-VAN-AP37-5500',
    orderedStopIds: JSON.stringify(['STOP-01', 'STOP-02']),
    totalDistanceKm: 4.8,
    estimatedEnergyKwh: 0.77,
    elevationAvoidedGainMeters: 35.0,
    optimizedAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-tsp-uuid',
      optimizedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { routeId } }) => {
      if (routeId === 'TSP-BZA-LOGISTICS-01') {
        return mockRoute;
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultiStopTspRoutingController],
      providers: [
        MultiStopTspRoutingService,
        {
          provide: getRepositoryToken(MultiStopTspRouteEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<MultiStopTspRoutingService>(MultiStopTspRoutingService);
    controller = module.get<MultiStopTspRoutingController>(MultiStopTspRoutingController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should optimize multi-stop delivery sequence considering priority and elevation penalty', async () => {
    const result = await controller.optimizeTspRoute({
      vehicleId: 'EV-VAN-AP37-5500',
      startDepotId: 'DEPOT-BENZ-CIRCLE',
      startLatitude: 16.505,
      startLongitude: 80.648,
      stops: [
        {
          stopId: 'STOP-HILL-TOP',
          recipientName: 'Hill Temple Vendor',
          latitude: 16.516,
          longitude: 80.605,
          elevationMeters: 95.0, // High elevation
          parcelWeightKg: 15.0,
          priority: 'STANDARD',
        },
        {
          stopId: 'STOP-RUSH-MED',
          recipientName: 'Emergency Hospital Pharmacy',
          latitude: 16.508,
          longitude: 80.635,
          elevationMeters: 22.0,
          parcelWeightKg: 5.0,
          priority: 'HIGH', // High priority must be served first
        },
      ],
    });

    expect(result.orderedStopIds[0]).toBe('STOP-RUSH-MED');
    expect(result.totalDistanceKm).toBeGreaterThan(0);
    expect(result.estimatedEnergyKwh).toBeGreaterThan(0);
  });

  it('should retrieve existing optimized TSP route', async () => {
    const route = await controller.getRoute('TSP-BZA-LOGISTICS-01');
    expect(route.routeId).toBe('TSP-BZA-LOGISTICS-01');
    expect(route.orderedStopIds.length).toBe(2);
  });
});
