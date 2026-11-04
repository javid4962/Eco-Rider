import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { QuotesService } from '../src/modules/quotes/quotes.service';
import { ZonesService } from '../src/modules/zones/zones.service';
import { getDataSourceToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { ApiErrorCode, RideStatus, RideActorRole } from '@ecoride/contracts';
import { Booking } from '../src/database/entities/booking.entity';
import { RideQuote } from '../src/database/entities/ride-quote.entity';
import { RideIncident } from '../src/database/entities/ride-incident.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';

describe('BookingsService - Idempotent Rides & Cancellation Policies (EV-039)', () => {
  let service: BookingsService;
  let mockQuotesService: Partial<QuotesService>;
  let mockZonesService: Partial<ZonesService>;
  let mockEntityManager: Record<string, jest.Mock>;
  let mockDataSource: {
    manager: Record<string, jest.Mock>;
    transaction: jest.Mock;
  };

  const validQuoteId = 'a0000000-0000-4000-8000-000000000001';
  const riderId = 'b0000000-0000-4000-8000-000000000001';
  const captainId = 'c0000000-0000-4000-8000-000000000001';
  const vehicleId = 'd0000000-0000-4000-8000-000000000001';
  const bookingId = 'e0000000-0000-4000-8000-000000000001';
  const idempotencyKey = 'idemp-test-ev039-key-001';

  beforeEach(async () => {
    mockQuotesService = {
      verifyQuoteToken: jest.fn().mockReturnValue({ isValid: true, payload: {} }),
    };

    mockZonesService = {
      verifyLocation: jest.fn().mockResolvedValue({ isAuthorized: true }),
    };

    mockEntityManager = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      query: jest.fn(),
      save: jest.fn().mockImplementation((entityOrClass: unknown, entity?: unknown) => {
        if (entity) return Promise.resolve(entity);
        return Promise.resolve(entityOrClass);
      }),
      create: jest.fn().mockImplementation((_entityClass: unknown, dto: unknown) => ({
        ...(dto as Record<string, unknown>),
      })),
      delete: jest.fn(),
      remove: jest.fn(),
    };

    mockDataSource = {
      manager: mockEntityManager,
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (m: Record<string, jest.Mock>) => Promise<unknown>) => {
          return cb(mockEntityManager);
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: QuotesService, useValue: mockQuotesService },
        { provide: ZonesService, useValue: mockZonesService },
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('createBookingFromQuote - Idempotency & Deduplication', () => {
    it('throws IDEMPOTENCY_KEY_REQUIRED if neither header nor body idempotency key is provided', async () => {
      await expect(
        service.createBookingFromQuote(riderId, {
          quoteId: validQuoteId,
          idempotencyKey: '',
        }),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.createBookingFromQuote(riderId, {
          quoteId: validQuoteId,
          idempotencyKey: '',
        });
      } catch (err: unknown) {
        const httpErr = err as { getResponse: () => { code?: string } };
        expect(httpErr.getResponse().code).toBe(ApiErrorCode.IDEMPOTENCY_KEY_REQUIRED);
      }
    });

    it('creates a new ride booking when valid quote and idempotency key are provided', async () => {
      const mockQuote: Partial<RideQuote> = {
        id: validQuoteId,
        riderId,
        status: 'ACTIVE',
        totalFarePaise: 12500,
        fareRuleId: 'fare-rule-1',
        fareRuleVersion: 1,
        serviceCategory: 'CITY_COMMUTE_2W',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.745,
        dropoffLongitude: 83.342,
        passengerCount: 1,
        expiresAt: new Date(Date.now() + 60000),
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockQuote),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);
      mockEntityManager.findOne.mockResolvedValue(null); // No existing booking with this key

      const result = await service.createBookingFromQuote(
        riderId,
        {
          quoteId: validQuoteId,
          idempotencyKey,
        },
        idempotencyKey,
      );

      expect(result).toBeDefined();
      expect(result.riderId).toBe(riderId);
      expect(result.quoteId).toBe(validQuoteId);
      expect(result.status).toBe('CREATED');
      expect(result.fareAmountRupees).toBe(125);
      expect(result.idempotencyKey).toBe(idempotencyKey);
      expect(mockQuote.status).toBe('CONSUMED');
      expect(mockQuote.idempotencyKey).toBe(idempotencyKey);
    });

    it('returns existing booking idempotently when same idempotency key is replayed (double-tap deduplication)', async () => {
      const existingBookingRow = {
        id: bookingId,
        booking_code: 'ECO-VZ-TEST001',
        rider_id: riderId,
        service_category: 'CITY_COMMUTE_2W',
        status: 'CREATED',
        start_otp: '4321',
        fare_amount: '125.00',
        quote_id: validQuoteId,
        fare_rule_id: 'fare-rule-1',
        fare_rule_version: 1,
        idempotency_key: idempotencyKey,
        passenger_count: 1,
        created_at: new Date(),
        pickup_latitude: 17.7126,
        pickup_longitude: 83.3174,
        dropoff_latitude: 17.745,
        dropoff_longitude: 83.342,
      };

      const mockQuote: Partial<RideQuote> = {
        id: validQuoteId,
        riderId,
        status: 'ACTIVE',
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockQuote),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);
      // Existing booking found with this key
      mockEntityManager.findOne.mockResolvedValue({ id: bookingId, idempotencyKey });
      mockEntityManager.query.mockResolvedValue([existingBookingRow]);

      const result = await service.createBookingFromQuote(riderId, {
        quoteId: validQuoteId,
        idempotencyKey,
      });

      expect(result.bookingId).toBe(bookingId);
      expect(result.bookingCode).toBe('ECO-VZ-TEST001');
      expect(result.idempotencyKey).toBe(idempotencyKey);
      // Ensure quote was NOT re-consumed or insert queried again
      expect(mockEntityManager.save).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: 'CONSUMED' }),
      );
    });

    it('rejects quote consumption when quote is already consumed with a different idempotency key (replay attack)', async () => {
      const consumedQuote: Partial<RideQuote> = {
        id: validQuoteId,
        riderId,
        status: 'CONSUMED',
        bookingId: 'prior-booking-uuid',
        idempotencyKey: 'prior-idempotency-key',
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(consumedQuote),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.createBookingFromQuote(riderId, {
          quoteId: validQuoteId,
          idempotencyKey: 'different-idempotency-key',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelRide - Policies, Fees & Preservation', () => {
    it('allows rider to cancel during REQUESTED state with ₹0 cancellation fee within grace period', async () => {
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        bookingCode: 'ECO-VZ-1234',
        riderId,
        status: RideStatus.REQUESTED,
        createdAt: new Date(),
        serviceCategory: 'CITY_COMMUTE_2W',
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBooking),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);
      mockEntityManager.find.mockResolvedValue([]); // No active incidents

      const result = await service.cancelRide(
        bookingId,
        { id: riderId, role: RideActorRole.RIDER, scopes: [] },
        { reason: 'Changed my travel plans' },
      );

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.cancellationFeePaise).toBe(0);
      expect(result.formattedCancellationFee).toBe('₹0.00');
      expect(result.gracePeriodExpired).toBe(false);
      expect(result.ledgerEntriesCreated).toBe(0);
      expect(result.ledgerEntriesPreserved).toBe(true);
      expect(mockBooking.cancellationFeePaise).toBe(0);
      expect(mockBooking.status).toBe(RideStatus.CANCELLED);
    });

    it('allows rider to cancel free of charge within 3 minutes of captain assignment (grace period)', async () => {
      const assignedAt = new Date(Date.now() - 60000); // 1 minute ago (< 3 min)
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        bookingCode: 'ECO-VZ-1234',
        riderId,
        captainId,
        vehicleId,
        status: RideStatus.ASSIGNED,
        assignedAt,
        createdAt: new Date(Date.now() - 120000),
        serviceCategory: 'CITY_COMMUTE_2W',
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBooking),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);
      mockEntityManager.find.mockResolvedValue([]);

      const result = await service.cancelRide(
        bookingId,
        { id: riderId, role: RideActorRole.RIDER, scopes: [] },
        { reason: 'Rider cancelled within grace period' },
      );

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.cancellationFeePaise).toBe(0);
      expect(result.gracePeriodExpired).toBe(false);
      expect(result.ledgerEntriesCreated).toBe(0);
    });

    it('assesses ₹15.00 statutory compensation fee and creates balanced ledger entries when rider cancels after 3-minute grace period', async () => {
      const assignedAt = new Date(Date.now() - 240000); // 4 minutes ago (> 3 min)
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        bookingCode: 'ECO-VZ-1234',
        riderId,
        captainId,
        vehicleId,
        status: RideStatus.ASSIGNED,
        assignedAt,
        createdAt: new Date(Date.now() - 300000),
        serviceCategory: 'CITY_COMMUTE_2W',
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBooking),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);
      mockEntityManager.find.mockResolvedValue([]);

      const result = await service.cancelRide(
        bookingId,
        { id: riderId, role: RideActorRole.RIDER, scopes: [] },
        { reason: 'Rider delayed cancel after 4 minutes' },
      );

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.cancellationFeePaise).toBe(1500); // 1500 paise = ₹15.00
      expect(result.formattedCancellationFee).toBe('₹15.00');
      expect(result.gracePeriodExpired).toBe(true);
      expect(result.ledgerEntriesCreated).toBe(2);
      expect(result.ledgerEntriesPreserved).toBe(true);

      // Verify double-entry ledger records were saved: 1 DEBIT rider, 1 CREDIT captain
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        LedgerEntry,
        expect.arrayContaining([
          expect.objectContaining({
            accountId: `rider:${riderId}`,
            entryType: 'DEBIT',
            amountPaise: 1500,
          }),
          expect.objectContaining({
            accountId: `captain:${captainId}`,
            entryType: 'CREDIT',
            amountPaise: 1500,
          }),
        ]),
      );
    });

    it('assesses ₹15.00 statutory compensation fee when rider cancels after captain has ARRIVED', async () => {
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        bookingCode: 'ECO-VZ-1234',
        riderId,
        captainId,
        vehicleId,
        status: RideStatus.ARRIVED,
        arrivedAt: new Date(Date.now() - 30000),
        createdAt: new Date(Date.now() - 300000),
        serviceCategory: 'CITY_COMMUTE_2W',
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBooking),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);
      mockEntityManager.find.mockResolvedValue([]);

      const result = await service.cancelRide(
        bookingId,
        { id: riderId, role: RideActorRole.RIDER, scopes: [] },
        { reason: 'Captain arrived but rider decided not to travel' },
      );

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.cancellationFeePaise).toBe(1500);
      expect(result.gracePeriodExpired).toBe(true);
      expect(result.ledgerEntriesCreated).toBe(2);
    });

    it('forbids rider from unilaterally cancelling a ride in IN_PROGRESS state', async () => {
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        riderId,
        captainId,
        status: RideStatus.IN_PROGRESS,
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBooking),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.cancelRide(
          bookingId,
          { id: riderId, role: RideActorRole.RIDER, scopes: [] },
          { reason: 'Want to stop midway' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('preserves active incidents and reports them in the cancellation response', async () => {
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        bookingCode: 'ECO-VZ-1234',
        riderId,
        captainId,
        status: RideStatus.ASSIGNED,
        assignedAt: new Date(Date.now() - 60000), // Within grace period
        createdAt: new Date(),
        serviceCategory: 'CITY_COMMUTE_2W',
      };

      const activeIncident: Partial<RideIncident> = {
        id: 'inc-001',
        bookingId,
        incidentCode: 'INC-1234-0001',
        incidentType: 'SAFETY_STOP',
        severity: 'HIGH',
        status: 'INVESTIGATING',
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBooking),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);
      mockEntityManager.find.mockResolvedValue([activeIncident]);

      const result = await service.cancelRide(
        bookingId,
        { id: riderId, role: RideActorRole.RIDER, scopes: [] },
        { reason: 'Cancelling due to safety incident' },
      );

      expect(result.currentStatus).toBe(RideStatus.CANCELLED);
      expect(result.activeIncidentsCount).toBe(1);
      expect(result.activeIncidents[0].incidentCode).toBe('INC-1234-0001');
      expect(result.activeIncidents[0].status).toBe('INVESTIGATING');
      expect(result.ledgerEntriesPreserved).toBe(true);
      // Ensure incident was NOT deleted or removed
      expect(mockEntityManager.delete).not.toBeCalled();
    });

    it('rejects cancellation on already terminated ride (CANCELLED/COMPLETED/FAILED)', async () => {
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        status: RideStatus.CANCELLED,
      };

      const qb = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBooking),
      };
      mockEntityManager.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.cancelRide(
          bookingId,
          { id: riderId, role: RideActorRole.RIDER, scopes: [] },
          { reason: 'Cancel again' },
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Ride Incidents & Ledger Queries', () => {
    it('creates an immutable safety incident linked to booking', async () => {
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        bookingCode: 'ECO-VZ-1234',
        riderId,
      };
      mockEntityManager.findOne.mockResolvedValue(mockBooking);

      const incident = await service.createRideIncident(
        bookingId,
        { id: riderId, role: RideActorRole.RIDER, scopes: [] },
        {
          incidentType: 'SOS_TRIGGERED',
          severity: 'HIGH',
          description: 'Passenger pressed SOS due to vehicle smoke smell',
        },
      );

      expect(incident).toBeDefined();
      expect(incident.bookingId).toBe(bookingId);
      expect(incident.incidentType).toBe('SOS_TRIGGERED');
      expect(incident.severity).toBe('HIGH');
      expect(incident.status).toBe('REPORTED');
      expect(incident.incidentCode).toMatch(/^INC-1234-/);
    });

    it('retrieves ledger entries preserving double-entry accounting records', async () => {
      const mockBooking: Partial<Booking> = {
        id: bookingId,
        riderId,
      };
      mockEntityManager.findOne.mockResolvedValue(mockBooking);

      const mockEntries: Partial<LedgerEntry>[] = [
        {
          id: 'led-1',
          bookingId,
          accountId: `rider:${riderId}`,
          entryType: 'DEBIT',
          amountPaise: 1500,
          currency: 'INR',
          idempotencyKey: 'cancel-debit-1',
          createdAt: new Date(),
        },
        {
          id: 'led-2',
          bookingId,
          accountId: `captain:${captainId}`,
          entryType: 'CREDIT',
          amountPaise: 1500,
          currency: 'INR',
          idempotencyKey: 'cancel-credit-1',
          createdAt: new Date(),
        },
      ];
      mockEntityManager.find.mockResolvedValue(mockEntries);

      const entries = await service.getRideLedgerEntries(bookingId, {
        id: riderId,
        role: RideActorRole.RIDER,
        scopes: [],
      });

      expect(entries).toHaveLength(2);
      expect(entries[0].entryType).toBe('DEBIT');
      expect(entries[0].amountPaise).toBe(1500);
      expect(entries[1].entryType).toBe('CREDIT');
      expect(entries[1].amountPaise).toBe(1500);
    });
  });
});
