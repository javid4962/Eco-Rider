import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { CorridorRoute } from '../../database/entities/corridor-route.entity';
import { CorridorSchedule } from '../../database/entities/corridor-schedule.entity';
import { CorridorTrip } from '../../database/entities/corridor-trip.entity';
import { CorridorSeatReservation } from '../../database/entities/corridor-seat-reservation.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CorridorTripStatus,
  CorridorReservationStatus,
  CorridorRouteDto,
  CreateCorridorRouteDto,
  CreateCorridorScheduleDto,
  CorridorScheduleDto,
  CorridorTripDto,
  BookCorridorSeatDto,
  CorridorSeatReservationDto,
  TripManifestDto,
  ApiErrorCode,
} from '@ecoride/contracts';

@Injectable()
export class CorridorsService {
  private readonly logger = new Logger(CorridorsService.name);

  constructor(
    @InjectRepository(CorridorRoute)
    private readonly routeRepo: Repository<CorridorRoute>,
    @InjectRepository(CorridorSchedule)
    private readonly scheduleRepo: Repository<CorridorSchedule>,
    @InjectRepository(CorridorTrip)
    private readonly tripRepo: Repository<CorridorTrip>,
    @InjectRepository(CorridorSeatReservation)
    private readonly reservationRepo: Repository<CorridorSeatReservation>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * EV-083: Create or register an electric corridor route in Andhra Pradesh.
   */
  async createRoute(dto: CreateCorridorRouteDto): Promise<CorridorRouteDto> {
    if (!dto.stops || dto.stops.length < 2) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Corridor route must have at least 2 ordered virtual stops.',
      });
    }

    const existing = await this.routeRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      return this.toRouteDto(existing);
    }

    const route = this.routeRepo.create({
      code: dto.code,
      name: dto.name,
      originCity: dto.originCity,
      destinationCity: dto.destinationCity,
      stops: dto.stops,
      totalDistanceMeters: dto.totalDistanceMeters,
      isActive: true,
    });

    const saved = await this.routeRepo.save(route);
    this.logger.log(`[CorridorsService] Registered corridor route: ${saved.code} (${saved.name})`);
    return this.toRouteDto(saved);
  }

  /**
   * List all active corridor routes.
   */
  async getRoutes(): Promise<CorridorRouteDto[]> {
    const routes = await this.routeRepo.find({ where: { isActive: true } });
    return routes.map((r) => this.toRouteDto(r));
  }

  /**
   * EV-084: Create fixed-schedule departure timetable for a corridor route.
   */
  async createSchedule(dto: CreateCorridorScheduleDto): Promise<CorridorScheduleDto> {
    const route = await this.routeRepo.findOne({ where: { id: dto.routeId } });
    if (!route) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Route '${dto.routeId}' not found.`,
      });
    }

    const schedule = this.scheduleRepo.create({
      routeId: dto.routeId,
      departureTime: dto.departureTime,
      daysOfWeek: dto.daysOfWeek,
      totalSeats: dto.totalSeats || 7,
      baseSegmentFarePaise: dto.baseSegmentFarePaise || 2500, // ₹25 per segment
      isActive: true,
    });

    const saved = await this.scheduleRepo.save(schedule);
    return {
      id: saved.id,
      routeId: saved.routeId,
      departureTime: saved.departureTime,
      daysOfWeek: saved.daysOfWeek,
      totalSeats: saved.totalSeats,
      baseSegmentFarePaise: Number(saved.baseSegmentFarePaise),
      isActive: saved.isActive,
    };
  }

  /**
   * EV-085 & EV-090: Retrieve or instantiate corridor trips for a given route and date.
   */
  async getTripsForDate(routeId: string, tripDate: string): Promise<CorridorTripDto[]> {
    const route = await this.routeRepo.findOne({ where: { id: routeId } });
    if (!route) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Route '${routeId}' not found.`,
      });
    }

    const dateObj = new Date(tripDate);
    // 1 = Monday, 7 = Sunday
    let dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    const schedules = await this.scheduleRepo.find({
      where: { routeId, isActive: true },
    });

    const activeSchedules = schedules.filter((s) => s.daysOfWeek.includes(dayOfWeek));
    const resultTrips: CorridorTripDto[] = [];

    for (const schedule of activeSchedules) {
      let trip = await this.tripRepo.findOne({
        where: { scheduleId: schedule.id, tripDate },
      });

      if (!trip) {
        trip = this.tripRepo.create({
          scheduleId: schedule.id,
          routeId: route.id,
          tripDate,
          departureTime: schedule.departureTime,
          totalSeats: schedule.totalSeats,
          status: CorridorTripStatus.SCHEDULED,
        });
        trip = await this.tripRepo.save(trip);
      }

      // Calculate available seats for the full journey
      const reservations = await this.reservationRepo.find({
        where: { tripId: trip.id, status: CorridorReservationStatus.CONFIRMED },
      });

      const maxBookedInAnySegment = this.calculateMaxConcurrentBookedSeats(
        reservations,
        route.stops.length,
      );
      const availableSeatsCount = Math.max(0, trip.totalSeats - maxBookedInAnySegment);

      resultTrips.push({
        id: trip.id,
        scheduleId: trip.scheduleId,
        routeId: trip.routeId,
        routeCode: route.code,
        routeName: route.name,
        tripDate: trip.tripDate,
        departureTime: trip.departureTime,
        totalSeats: trip.totalSeats,
        status: trip.status as CorridorTripStatus,
        vehicleId: trip.vehicleId,
        captainId: trip.captainId,
        availableSeatsCount,
      });
    }

    return resultTrips;
  }

  /**
   * EV-091 – EV-097: Atomic Segment-Based Passenger Pooling & Seat Reservation
   * Enforces ACID concurrency locks, spatial segment non-overlap, and balanced double-entry ledger.
   */
  async bookSeats(
    actor: CurrentActorPayload | undefined,
    dto: BookCorridorSeatDto,
  ): Promise<CorridorSeatReservationDto> {
    const seatCount = Number(dto.seatCount) || 1;
    if (seatCount <= 0 || seatCount > 4) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Seat booking count must be between 1 and 4 seats per reservation.',
      });
    }

    if (dto.fromStopSequence >= dto.toStopSequence) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Dropoff stop sequence must be strictly greater than pickup stop sequence.',
      });
    }

    const effectiveRiderId = dto.riderId || actor?.id;
    if (!effectiveRiderId) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'A valid riderId is required to reserve corridor seats.',
      });
    }

    const idempotencyKey =
      dto.idempotencyKey || `corr_res_${dto.tripId}_${effectiveRiderId}_${Date.now()}`;

    // Replay check
    const existing = await this.reservationRepo.findOne({
      where: { idempotencyKey },
    });
    if (existing) {
      return this.toReservationDto(existing, [existing.seatNumber]);
    }

    return await this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Pessimistic write lock on CorridorTrip to serialize competing reservations
      const trip = await manager
        .createQueryBuilder(CorridorTrip, 't')
        .setLock('pessimistic_write')
        .where('t.id = :id', { id: dto.tripId })
        .getOne();

      if (!trip) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Corridor trip '${dto.tripId}' not found.`,
        });
      }

      if (trip.status === CorridorTripStatus.COMPLETED || trip.status === CorridorTripStatus.CANCELLED) {
        throw new ConflictException({
          code: ApiErrorCode.ILLEGAL_STATUS_TRANSITION,
          message: `Cannot book seats on a corridor trip with status '${trip.status}'.`,
        });
      }

      const route = await manager.findOne(CorridorRoute, { where: { id: trip.routeId } });
      const schedule = await manager.findOne(CorridorSchedule, { where: { id: trip.scheduleId } });

      if (!route || !schedule) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: 'Route or schedule metadata not found for this trip.',
        });
      }

      const fromStop = route.stops.find((s) => s.sequenceNumber === dto.fromStopSequence);
      const toStop = route.stops.find((s) => s.sequenceNumber === dto.toStopSequence);

      if (!fromStop || !toStop) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: 'Specified stop sequence numbers do not exist on this corridor route.',
        });
      }

      // 2. Fetch all active reservations for this trip
      const existingReservations = await manager.find(CorridorSeatReservation, {
        where: { tripId: trip.id, status: CorridorReservationStatus.CONFIRMED },
      });

      // 3. Segment Occupancy Check:
      // A seat s is occupied during requested segment [F_req, T_req) if any active reservation
      // with seat_number = s overlaps with [F_req, T_req).
      // Overlap condition: max(F_res, F_req) < min(T_res, T_req)
      const occupiedSeats = new Set<number>();
      for (const res of existingReservations) {
        const hasOverlap =
          Math.max(res.fromStopSequence, dto.fromStopSequence) <
          Math.min(res.toStopSequence, dto.toStopSequence);
        if (hasOverlap) {
          occupiedSeats.add(res.seatNumber);
        }
      }

      const freeSeatNumbers: number[] = [];
      for (let s = 1; s <= trip.totalSeats; s++) {
        if (!occupiedSeats.has(s)) {
          freeSeatNumbers.push(s);
        }
      }

      if (freeSeatNumbers.length < seatCount) {
        throw new ConflictException({
          code: ApiErrorCode.CONFLICT,
          message: `Insufficient seats available on this segment. Available: ${freeSeatNumbers.length}, Requested: ${seatCount}.`,
        });
      }

      const allocatedSeats = freeSeatNumbers.slice(0, seatCount);
      const segmentDistanceCount = dto.toStopSequence - dto.fromStopSequence;
      const baseFare = Number(schedule.baseSegmentFarePaise);
      const totalFarePaise = baseFare * segmentDistanceCount * seatCount;

      const boardingPassCode = `BP-${randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase()}`;

      // 4. Create and persist reservation
      const primaryReservation = manager.create(CorridorSeatReservation, {
        id: randomUUID(),
        tripId: trip.id,
        riderId: effectiveRiderId,
        fromStopSequence: dto.fromStopSequence,
        fromStopName: fromStop.name,
        toStopSequence: dto.toStopSequence,
        toStopName: toStop.name,
        seatNumber: allocatedSeats[0],
        boardingPassCode,
        farePaise: totalFarePaise,
        idempotencyKey,
        status: CorridorReservationStatus.CONFIRMED,
        checkedIn: false,
      });

      await manager.save(primaryReservation);

      // If multiple seats were booked in this single request, reserve subsequent seats under same pass
      for (let i = 1; i < allocatedSeats.length; i++) {
        const extraRes = manager.create(CorridorSeatReservation, {
          id: randomUUID(),
          tripId: trip.id,
          riderId: effectiveRiderId,
          fromStopSequence: dto.fromStopSequence,
          fromStopName: fromStop.name,
          toStopSequence: dto.toStopSequence,
          toStopName: toStop.name,
          seatNumber: allocatedSeats[i],
          boardingPassCode: `${boardingPassCode}-${i + 1}`,
          farePaise: 0, // bundled in primary
          idempotencyKey: `${idempotencyKey}_seat_${allocatedSeats[i]}`,
          status: CorridorReservationStatus.CONFIRMED,
          checkedIn: false,
        });
        await manager.save(extraRes);
      }

      // 5. Post Balanced Double-Entry Ledger Entries
      // Entry 1: DEBIT - Rider Account
      const debitEntry = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${idempotencyKey}_dr_rider`,
        accountId: `RIDER_ACCOUNT_${effectiveRiderId}`,
        entryType: 'DEBIT',
        amountPaise: totalFarePaise,
        currency: 'INR',
        description: `Corridor shuttle pass ${boardingPassCode} (${fromStop.name} to ${toStop.name})`,
      });

      // Entry 2: CREDIT - Corridor Transit Revenue
      const creditEntry = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${idempotencyKey}_cr_corr_rev`,
        accountId: 'CORRIDOR_SHUTTLE_REVENUE',
        entryType: 'CREDIT',
        amountPaise: totalFarePaise,
        currency: 'INR',
        description: `Revenue from corridor pass ${boardingPassCode} for trip ${trip.id}`,
      });

      await manager.save([debitEntry, creditEntry]);

      this.logger.log(
        `[CorridorsService] Confirmed seat reservation ${boardingPassCode} for rider ${effectiveRiderId}: Seats [${allocatedSeats.join(', ')}], ₹${(totalFarePaise / 100).toFixed(2)}`,
      );

      return this.toReservationDto(primaryReservation, allocatedSeats);
    });
  }

  /**
   * EV-088: Generate Passenger Manifest for Corridor Trip.
   */
  async getTripManifest(
    tripId: string,
    actor: CurrentActorPayload | undefined,
  ): Promise<TripManifestDto> {
    const actorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const isPrivileged = ['ADMIN', 'OPERATOR', 'DISPATCHER', 'CAPTAIN', 'SYSTEM'].includes(
      actorRole,
    );

    if (!isPrivileged) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'Access denied: Only dispatchers, operators, or assigned captains can view passenger manifests.',
      });
    }

    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Trip '${tripId}' not found.`,
      });
    }

    const route = await this.routeRepo.findOne({ where: { id: trip.routeId } });
    const reservations = await this.reservationRepo.find({
      where: { tripId: trip.id, status: CorridorReservationStatus.CONFIRMED },
      order: { fromStopSequence: 'ASC', seatNumber: 'ASC' },
    });

    return {
      tripId: trip.id,
      routeCode: route?.code || 'CORR-AP',
      routeName: route?.name || 'Andhra Pradesh Corridor',
      tripDate: trip.tripDate,
      departureTime: trip.departureTime,
      totalSeats: trip.totalSeats,
      bookedSeatsCount: reservations.length,
      entries: reservations.map((r) => ({
        reservationId: r.id,
        seatNumber: r.seatNumber,
        riderId: r.riderId,
        fromStopSequence: r.fromStopSequence,
        fromStopName: r.fromStopName,
        toStopSequence: r.toStopSequence,
        toStopName: r.toStopName,
        boardingPassCode: r.boardingPassCode,
        checkedIn: r.checkedIn,
        checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
      })),
    };
  }

  /**
   * EV-089: Check in a passenger at a virtual stop.
   */
  async checkInPassenger(
    tripId: string,
    boardingPassCode: string,
    actor: CurrentActorPayload | undefined,
  ): Promise<{ success: boolean; message: string; checkedInAt: string }> {
    const reservation = await this.reservationRepo.findOne({
      where: { tripId, boardingPassCode },
    });

    if (!reservation) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Boarding pass code '${boardingPassCode}' not found for trip '${tripId}'.`,
      });
    }

    const now = new Date();
    reservation.checkedIn = true;
    reservation.checkedInAt = now;
    reservation.status = CorridorReservationStatus.CHECKED_IN;
    await this.reservationRepo.save(reservation);

    this.logger.log(
      `[CorridorsService] Checked in passenger for pass ${boardingPassCode} (Seat #${reservation.seatNumber}) by actor ${actor?.id || 'SYSTEM'}`,
    );

    return {
      success: true,
      message: `Boarding pass ${boardingPassCode} checked in successfully.`,
      checkedInAt: now.toISOString(),
    };
  }

  private calculateMaxConcurrentBookedSeats(
    reservations: CorridorSeatReservation[],
    totalStopsCount: number,
  ): number {
    let maxCount = 0;
    // Check concurrent occupancy at each segment between stops i and i+1
    for (let seg = 1; seg < totalStopsCount; seg++) {
      let count = 0;
      for (const r of reservations) {
        if (r.fromStopSequence <= seg && r.toStopSequence > seg) {
          count++;
        }
      }
      if (count > maxCount) {
        maxCount = count;
      }
    }
    return maxCount;
  }

  private toRouteDto(route: CorridorRoute): CorridorRouteDto {
    return {
      id: route.id,
      code: route.code,
      name: route.name,
      originCity: route.originCity,
      destinationCity: route.destinationCity,
      stops: route.stops,
      totalDistanceMeters: route.totalDistanceMeters,
      isActive: route.isActive,
    };
  }

  private toReservationDto(
    res: CorridorSeatReservation,
    seatNumbers: number[],
  ): CorridorSeatReservationDto {
    const farePaise = Number(res.farePaise);
    return {
      reservationId: res.id,
      tripId: res.tripId,
      bookingCode: `CORR-${res.fromStopSequence}-${res.toStopSequence}`,
      riderId: res.riderId,
      seatNumbers,
      fromStopSequence: res.fromStopSequence,
      fromStopName: res.fromStopName,
      toStopSequence: res.toStopSequence,
      toStopName: res.toStopName,
      farePaise,
      formattedFare: `₹${(farePaise / 100).toFixed(2)}`,
      boardingPassCode: res.boardingPassCode,
      status: res.status as CorridorReservationStatus,
      checkedIn: res.checkedIn,
      createdAt: res.createdAt ? res.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
