import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OutstationService } from '../src/modules/outstation/outstation.service';
import { OutstationController } from '../src/modules/outstation/outstation.controller';
import { OutstationRoute } from '../src/database/entities/outstation-route.entity';
import { OutstationTrip } from '../src/database/entities/outstation-trip.entity';

describe('OutstationService (M35)', () => {
  let service: OutstationService;
  let mockRouteRepo: any;
  let mockTripRepo: any;

  beforeEach(async () => {
    mockRouteRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    };

    mockTripRepo = {
      create: jest.fn((e) => ({ ...e, id: 'trip-123', departureTime: new Date(e.departureTime) })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'trip-123' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutstationController],
      providers: [
        OutstationService,
        { provide: getRepositoryToken(OutstationRoute), useValue: mockRouteRepo },
        { provide: getRepositoryToken(OutstationTrip), useValue: mockTripRepo },
      ],
    }).compile();

    service = module.get<OutstationService>(OutstationService);
  });

  it('should list seeded inter-city outstation corridors', async () => {
    const routes = await service.listRoutes();
    expect(routes.length).toBe(3);
    const vjaGnt = routes.find((r) => r.routeCode === 'VJA-GNT-EXPRESS');
    expect(vjaGnt).toBeDefined();
    expect(vjaGnt?.distanceKm).toBe(36.5);
    expect(vjaGnt?.tollEstimatePaise).toBe(11000); // ₹110.00 Kaza Toll
  });

  it('should book outstation trip with pass-through FASTag toll', async () => {
    const trip = await service.bookTrip('r0000000-0000-4000-8000-000000000001', {
      routeId: 'rt-vja-gnt-01',
      pickupAddress: 'Benz Circle, Vijayawada',
      dropoffAddress: 'Brodipet, Guntur',
      departureTime: new Date().toISOString(),
      passengerCount: 3,
      fastagTollIncluded: true,
    });

    expect(trip.bookingId).toBe('trip-123');
    expect(trip.routeCode).toBe('VJA-GNT-EXPRESS');
    expect(trip.tollFeePaise).toBe(11000); // ₹110.00
    expect(trip.totalFarePaise).toBe(96000); // ₹850 + ₹110 = ₹960.00 (96000 paise)
    expect(mockTripRepo.save).toHaveBeenCalled();
  });

  it('should book longer route with mandatory en-route DC fast charging stop', async () => {
    const trip = await service.bookTrip('r0000000-0000-4000-8000-000000000001', {
      routeId: 'rt-vja-mpt-02',
      pickupAddress: 'BZA Station, Vijayawada',
      dropoffAddress: 'Machilipatnam Port Area',
      departureTime: new Date().toISOString(),
      passengerCount: 2,
      fastagTollIncluded: true,
    });

    expect(trip.plannedChargingStop).toContain('Pamarru Highway DC Fast Charger');
    expect(trip.tollFeePaise).toBe(16000);
  });

  it('should reject trip booking if passenger count exceeds 6', async () => {
    await expect(
      service.bookTrip('r0000000-0000-4000-8000-000000000001', {
        routeId: 'rt-vja-gnt-01',
        pickupAddress: 'Benz Circle',
        dropoffAddress: 'Brodipet',
        departureTime: new Date().toISOString(),
        passengerCount: 8,
        fastagTollIncluded: false,
      }),
    ).rejects.toThrow('capped at 6 passengers');
  });
});

