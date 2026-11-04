import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { CorridorsService } from '../src/modules/corridors/corridors.service';
import { CorridorsController } from '../src/modules/corridors/corridors.controller';
import { CorridorRoute } from '../src/database/entities/corridor-route.entity';
import { CorridorSchedule } from '../src/database/entities/corridor-schedule.entity';
import { CorridorTrip } from '../src/database/entities/corridor-trip.entity';
import { CorridorSeatReservation } from '../src/database/entities/corridor-seat-reservation.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import {
  CorridorTripStatus,
  CorridorReservationStatus,
  CorridorVirtualStop,
} from '@ecoride/contracts';

describe('Milestones M10 & M11: Shared-Schedule Corridors & Passenger Pooling (EV-083 – EV-097)', () => {
  let corridorsService: CorridorsService;
  let corridorsController: CorridorsController;

  const sampleStops: CorridorVirtualStop[] = [
    {
      stopId: 'stop-vja-pnbs',
      name: 'Pandit Nehru Bus Station (Vijayawada)',
      sequenceNumber: 1,
      latitude: 16.5175,
      longitude: 80.6201,
      city: 'Vijayawada',
    },
    {
      stopId: 'stop-mgl-aiims',
      name: 'Mangalagiri AIIMS',
      sequenceNumber: 2,
      latitude: 16.4357,
      longitude: 80.5654,
      city: 'Mangalagiri',
    },
    {
      stopId: 'stop-gnt-ntr',
      name: 'Guntur NTR Bus Station',
      sequenceNumber: 3,
      latitude: 16.3067,
      longitude: 80.4365,
      city: 'Guntur',
    },
    {
      stopId: 'stop-amr-sec',
      name: 'AP Secretariat (Amaravathi)',
      sequenceNumber: 4,
      latitude: 16.5131,
      longitude: 80.5165,
      city: 'Amaravathi',
    },
  ];

  const storedRoutes: CorridorRoute[] = [];
  const storedSchedules: CorridorSchedule[] = [];
  const storedTrips: CorridorTrip[] = [];
  const storedReservations: CorridorSeatReservation[] = [];
  const storedLedgerEntries: LedgerEntry[] = [];

  const mockRouteRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedRoutes.find((r) => {
        for (const k of Object.keys(where)) {
          if ((r as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async () => [...storedRoutes]),
    create: jest.fn().mockImplementation((data: Partial<CorridorRoute>) => {
      return {
        id: 'route_' + Math.random().toString(36).substring(2, 9),
        isActive: true,
        totalDistanceMeters: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as CorridorRoute;
    }),
    save: jest.fn().mockImplementation(async (data: CorridorRoute) => {
      const idx = storedRoutes.findIndex((r) => r.id === data.id);
      if (idx >= 0) storedRoutes[idx] = data;
      else storedRoutes.push(data);
      return data;
    }),
  };

  const mockScheduleRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedSchedules.find((s) => {
        for (const k of Object.keys(where)) {
          if ((s as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async () => [...storedSchedules]),
    create: jest.fn().mockImplementation((data: Partial<CorridorSchedule>) => {
      return {
        id: 'sched_' + Math.random().toString(36).substring(2, 9),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as CorridorSchedule;
    }),
    save: jest.fn().mockImplementation(async (data: CorridorSchedule) => {
      const idx = storedSchedules.findIndex((s) => s.id === data.id);
      if (idx >= 0) storedSchedules[idx] = data;
      else storedSchedules.push(data);
      return data;
    }),
  };

  const mockTripRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedTrips.find((t) => {
        for (const k of Object.keys(where)) {
          if ((t as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async () => [...storedTrips]),
    create: jest.fn().mockImplementation((data: Partial<CorridorTrip>) => {
      return {
        id: 'trip_' + Math.random().toString(36).substring(2, 9),
        status: CorridorTripStatus.SCHEDULED,
        totalSeats: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as CorridorTrip;
    }),
    save: jest.fn().mockImplementation(async (data: CorridorTrip) => {
      const idx = storedTrips.findIndex((t) => t.id === data.id);
      if (idx >= 0) storedTrips[idx] = data;
      else storedTrips.push(data);
      return data;
    }),
  };

  const mockReservationRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedReservations.find((r) => {
        for (const k of Object.keys(where)) {
          if ((r as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async (criteria: { where?: Record<string, unknown> }) => {
      if (!criteria?.where) return [...storedReservations];
      const where = criteria.where;
      return storedReservations.filter((r) => {
        for (const k of Object.keys(where)) {
          if ((r as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      });
    }),
    save: jest.fn().mockImplementation(async (data: CorridorSeatReservation) => {
      const idx = storedReservations.findIndex((r) => r.id === data.id);
      if (idx >= 0) storedReservations[idx] = data;
      else storedReservations.push(data);
      return data;
    }),
  };

  const mockEntityManager: Partial<EntityManager> = {
    findOne: jest.fn().mockImplementation(async (entityClass: unknown, criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      if (entityClass === CorridorRoute) {
        return storedRoutes.find((r) => (r as unknown as Record<string, unknown>).id === where.id) || null;
      }
      if (entityClass === CorridorSchedule) {
        return storedSchedules.find((s) => (s as unknown as Record<string, unknown>).id === where.id) || null;
      }
      return null;
    }),
    find: jest.fn().mockImplementation(async (entityClass: unknown, criteria: { where: Record<string, unknown> }) => {
      if (entityClass === CorridorSeatReservation) {
        return storedReservations.filter((r) => r.tripId === criteria.where.tripId && r.status === criteria.where.status);
      }
      return [];
    }),
    createQueryBuilder: jest.fn().mockImplementation(() => ({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(async () => storedTrips[0] || null),
    })),
    create: jest.fn().mockImplementation((_entityClass: unknown, plainObj: Record<string, unknown>) => ({
      ...plainObj,
    })),
    save: jest.fn().mockImplementation(async (target: unknown) => {
      if (Array.isArray(target)) {
        for (const item of target) {
          if ((item as LedgerEntry).entryType) {
            storedLedgerEntries.push(item as LedgerEntry);
          }
        }
        return target;
      }
      const res = target as CorridorSeatReservation;
      if (res?.boardingPassCode) {
        storedReservations.push(res);
      }
      return target;
    }),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb: (manager: EntityManager) => Promise<unknown>) => {
      return cb(mockEntityManager as EntityManager);
    }),
  };

  beforeEach(async () => {
    storedRoutes.length = 0;
    storedSchedules.length = 0;
    storedTrips.length = 0;
    storedReservations.length = 0;
    storedLedgerEntries.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CorridorsController],
      providers: [
        CorridorsService,
        {
          provide: getRepositoryToken(CorridorRoute),
          useValue: mockRouteRepo,
        },
        {
          provide: getRepositoryToken(CorridorSchedule),
          useValue: mockScheduleRepo,
        },
        {
          provide: getRepositoryToken(CorridorTrip),
          useValue: mockTripRepo,
        },
        {
          provide: getRepositoryToken(CorridorSeatReservation),
          useValue: mockReservationRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    corridorsService = module.get<CorridorsService>(CorridorsService);
    corridorsController = module.get<CorridorsController>(CorridorsController);
  });

  describe('EV-083 & EV-084: Corridor Routes & Fixed Departure Timetables', () => {
    it('should register a valid 4-stop AP capital corridor route', async () => {
      const route = await corridorsService.createRoute({
        code: 'CORR-AP-VJA-AMR',
        name: 'Vijayawada – Amaravathi Electric Shuttle',
        originCity: 'Vijayawada',
        destinationCity: 'Amaravathi',
        stops: sampleStops,
        totalDistanceMeters: 45000,
      });

      expect(route).toBeDefined();
      expect(route.code).toBe('CORR-AP-VJA-AMR');
      expect(route.stops.length).toBe(4);
      expect(storedRoutes.length).toBe(1);
    });

    it('should reject route registration with fewer than 2 stops', async () => {
      await expect(
        corridorsService.createRoute({
          code: 'CORR-INVALID',
          name: 'Invalid Route',
          originCity: 'Vijayawada',
          destinationCity: 'Vijayawada',
          stops: [sampleStops[0]],
          totalDistanceMeters: 0,
        }),
      ).rejects.toThrow();
    });

    it('should create fixed-schedule departure timetable', async () => {
      const route = await corridorsService.createRoute({
        code: 'CORR-AP-VJA-AMR',
        name: 'Vijayawada – Amaravathi Electric Shuttle',
        originCity: 'Vijayawada',
        destinationCity: 'Amaravathi',
        stops: sampleStops,
        totalDistanceMeters: 45000,
      });

      const schedule = await corridorsService.createSchedule({
        routeId: route.id,
        departureTime: '08:30',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // Daily
        totalSeats: 7,
        baseSegmentFarePaise: 2500, // ₹25 per segment
      });

      expect(schedule.departureTime).toBe('08:30');
      expect(schedule.totalSeats).toBe(7);
      expect(storedSchedules.length).toBe(1);
    });
  });

  describe('EV-091 – EV-097: Segment-Based Passenger Pooling & Seat Reuse', () => {
    let routeId: string;
    let tripId: string;

    beforeEach(async () => {
      const route = await corridorsService.createRoute({
        code: 'CORR-AP-VJA-AMR',
        name: 'Vijayawada – Amaravathi Electric Shuttle',
        originCity: 'Vijayawada',
        destinationCity: 'Amaravathi',
        stops: sampleStops,
        totalDistanceMeters: 45000,
      });
      routeId = route.id;

      await corridorsService.createSchedule({
        routeId,
        departureTime: '08:30',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        totalSeats: 7,
        baseSegmentFarePaise: 2500,
      });

      const trips = await corridorsService.getTripsForDate(routeId, '2026-11-05');
      tripId = trips[0].id;
    });

    it('should allow Seat #1 to be booked for Stop 1 -> 2, and then reused by another passenger for Stop 2 -> 4', async () => {
      const riderA = { id: 'rider_A_uuid', role: 'RIDER', scopes: [] };
      const riderB = { id: 'rider_B_uuid', role: 'RIDER', scopes: [] };

      // 1. Rider A books Stop 1 -> Stop 2 (Vijayawada -> Mangalagiri)
      const resA = await corridorsService.bookSeats(riderA, {
        tripId,
        fromStopSequence: 1,
        toStopSequence: 2,
        seatCount: 1,
        idempotencyKey: 'idem_rider_A',
      });

      expect(resA.seatNumbers).toEqual([1]);
      expect(resA.farePaise).toBe(2500); // 1 segment * ₹25 = ₹25.00
      expect(resA.status).toBe(CorridorReservationStatus.CONFIRMED);

      // 2. Rider B books Stop 2 -> Stop 4 (Mangalagiri -> Amaravathi)
      // Since Stop 1 -> 2 does not overlap with Stop 2 -> 4, Seat #1 should be FREE again!
      const resB = await corridorsService.bookSeats(riderB, {
        tripId,
        fromStopSequence: 2,
        toStopSequence: 4,
        seatCount: 1,
        idempotencyKey: 'idem_rider_B',
      });

      expect(resB.seatNumbers).toEqual([1]); // Reused Seat #1!
      expect(resB.farePaise).toBe(5000); // 2 segments * ₹25 = ₹50.00
      expect(resB.status).toBe(CorridorReservationStatus.CONFIRMED);

      // Verify double-entry ledger entries were generated for both bookings
      expect(storedLedgerEntries.length).toBe(4);
      const totalDebits = storedLedgerEntries
        .filter((e) => e.entryType === 'DEBIT')
        .reduce((sum, e) => sum + Number(e.amountPaise), 0);
      const totalCredits = storedLedgerEntries
        .filter((e) => e.entryType === 'CREDIT')
        .reduce((sum, e) => sum + Number(e.amountPaise), 0);

      expect(totalDebits).toBe(7500); // 2500 + 5000
      expect(totalCredits).toBe(7500);
      expect(totalDebits).toBe(totalCredits); // Exact parity
    });

    it('should reject booking when requested segment seats are exhausted', async () => {
      const rider = { id: 'rider_uuid', role: 'RIDER', scopes: [] };

      // Seed 7 occupied reservations on segment 1 -> 2
      for (let s = 1; s <= 7; s++) {
        storedReservations.push({
          id: `res_${s}`,
          tripId,
          riderId: `r_${s}`,
          fromStopSequence: 1,
          fromStopName: sampleStops[0].name,
          toStopSequence: 2,
          toStopName: sampleStops[1].name,
          seatNumber: s,
          boardingPassCode: `BP-TEST-${s}`,
          farePaise: 2500,
          idempotencyKey: `idem_seed_${s}`,
          status: CorridorReservationStatus.CONFIRMED,
          checkedIn: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CorridorSeatReservation);
      }

      await expect(
        corridorsService.bookSeats(rider, {
          tripId,
          fromStopSequence: 1,
          toStopSequence: 3,
          seatCount: 1,
        }),
      ).rejects.toThrow();
    });
  });

  describe('EV-088 & EV-089: Passenger Manifest & Stop Check-In', () => {
    let tripId: string;

    beforeEach(async () => {
      const route = await corridorsService.createRoute({
        code: 'CORR-AP-VJA-AMR',
        name: 'Vijayawada – Amaravathi Electric Shuttle',
        originCity: 'Vijayawada',
        destinationCity: 'Amaravathi',
        stops: sampleStops,
        totalDistanceMeters: 45000,
      });

      await corridorsService.createSchedule({
        routeId: route.id,
        departureTime: '08:30',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        totalSeats: 7,
        baseSegmentFarePaise: 2500,
      });

      const trips = await corridorsService.getTripsForDate(route.id, '2026-11-05');
      tripId = trips[0].id;
    });

    it('should generate passenger manifest and allow captain check-in with boarding pass', async () => {
      const rider = { id: 'rider_001', role: 'RIDER', scopes: [] };
      const reservation = await corridorsService.bookSeats(rider, {
        tripId,
        fromStopSequence: 1,
        toStopSequence: 3,
        seatCount: 1,
      });

      const captain = { id: 'captain_001', role: 'CAPTAIN', scopes: [] };

      // 1. Get manifest
      const manifest = await corridorsService.getTripManifest(tripId, captain);
      expect(manifest.tripId).toBe(tripId);
      expect(manifest.bookedSeatsCount).toBe(1);
      expect(manifest.entries[0].boardingPassCode).toBe(reservation.boardingPassCode);

      // 2. Check in passenger
      const checkInResult = await corridorsService.checkInPassenger(
        tripId,
        reservation.boardingPassCode,
        captain,
      );

      expect(checkInResult.success).toBe(true);
      expect(checkInResult.checkedInAt).toBeDefined();

      const updatedReservation = storedReservations.find(
        (r) => r.boardingPassCode === reservation.boardingPassCode,
      );
      expect(updatedReservation?.checkedIn).toBe(true);
      expect(updatedReservation?.status).toBe(CorridorReservationStatus.CHECKED_IN);
    });

    it('should reject manifest retrieval by unauthorized non-crew riders', async () => {
      const unauthorizedRider = { id: 'rider_999', role: 'RIDER', scopes: [] };
      await expect(
        corridorsService.getTripManifest(tripId, unauthorizedRider),
      ).rejects.toThrow();
    });
  });

  describe('CorridorsController Endpoints', () => {
    it('should route getRoutes through CorridorsController', async () => {
      await corridorsService.createRoute({
        code: 'CORR-VJA-GNT',
        name: 'Vijayawada – Guntur Express',
        originCity: 'Vijayawada',
        destinationCity: 'Guntur',
        stops: sampleStops.slice(0, 3),
        totalDistanceMeters: 32000,
      });

      const routes = await corridorsController.getRoutes();
      expect(routes.length).toBe(1);
      expect(routes[0].code).toBe('CORR-VJA-GNT');
    });
  });
});
