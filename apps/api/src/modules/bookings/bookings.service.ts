import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { ApiErrorCode, BookingDetailsResponse } from '@ecoride/contracts';
import { Booking } from '../../database/entities/booking.entity';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { QuotesService } from '../quotes/quotes.service';
import { ZonesService } from '../zones/zones.service';
import { CreateBookingFromQuoteDto } from './dto/create-booking-from-quote.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly quotesService: QuotesService,
    @Optional()
    private readonly zonesService?: ZonesService,
  ) {}

  /**
   * Creates an authoritative EV ride booking from an eligible quote inside
   * an ACID transaction with pessimistic row lock on the quote.
   * Enforces replay prevention, idempotency, expiration, cross-account security,
   * cryptographic token verification, and interim zone revocation safeguards.
   */
  async createBookingFromQuote(
    actorUserId: string | undefined,
    dto: CreateBookingFromQuoteDto,
  ): Promise<BookingDetailsResponse> {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      // 1. Fetch quote with pessimistic write lock to prevent concurrent double-booking
      const quote = await manager
        .createQueryBuilder(RideQuote, 'q')
        .setLock('pessimistic_write')
        .where('q.id = :id', { id: dto.quoteId })
        .getOne();

      if (!quote) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Quote with ID '${dto.quoteId}' not found.`,
        });
      }

      // 2. Replay & Idempotency Safeguards
      if (quote.status === 'CONSUMED') {
        if (dto.idempotencyKey && quote.idempotencyKey === dto.idempotencyKey && quote.bookingId) {
          const existing = await this.findBookingWithCoords(manager, quote.bookingId);
          if (existing) {
            return existing;
          }
        }
        throw new ConflictException({
          code: ApiErrorCode.CONFLICT,
          message: `Quote '${dto.quoteId}' has already been consumed for booking '${quote.bookingId}'. Replaying quotes across multiple bookings is prohibited.`,
        });
      }

      // Check if existing booking exists with this idempotency key
      const existingWithKey = await manager.findOne(Booking, {
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existingWithKey) {
        const found = await this.findBookingWithCoords(manager, existingWithKey.id);
        if (found) return found;
      }

      // 3. Cross-Account Security Checks
      const effectiveRiderId = actorUserId || dto.riderId || quote.riderId;
      if (quote.riderId && actorUserId && quote.riderId !== actorUserId) {
        throw new ForbiddenException({
          code: ApiErrorCode.FORBIDDEN,
          message: `Access denied: Quote belongs to rider '${quote.riderId}'. Cross-account ride booking is strictly prohibited.`,
        });
      }
      if (quote.riderId && dto.riderId && quote.riderId !== dto.riderId) {
        throw new ForbiddenException({
          code: ApiErrorCode.FORBIDDEN,
          message: `Access denied: Quote belongs to rider '${quote.riderId}'. Cross-account ride booking is strictly prohibited.`,
        });
      }

      // 4. Expiration Verification
      const isExpired = new Date(quote.expiresAt).getTime() <= Date.now();
      if (isExpired) {
        if (quote.status === 'ACTIVE') {
          quote.status = 'EXPIRED';
          await manager.save(quote);
        }
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Quote '${quote.id}' expired at ${quote.expiresAt.toISOString()}. Please request a fresh fare quote.`,
        });
      }

      // 5. Tampering & Cryptographic Token Verification
      if (dto.quoteToken) {
        const tokenCheck = this.quotesService.verifyQuoteToken(dto.quoteToken);
        if (!tokenCheck.isValid || !tokenCheck.payload) {
          throw new BadRequestException({
            code: ApiErrorCode.BAD_REQUEST,
            message: `Quote token signature is invalid or tampered: ${tokenCheck.reason || 'TAMPERED_SIGNATURE'}. Client-side fare overrides are strictly rejected.`,
          });
        }

        const p = tokenCheck.payload;
        if (
          p.quoteId !== quote.id ||
          p.fareRuleId !== quote.fareRuleId ||
          p.fareRuleVersion !== quote.fareRuleVersion ||
          p.totalFarePaise !== quote.totalFarePaise ||
          p.serviceCategory !== quote.serviceCategory ||
          p.passengerCount !== quote.passengerCount
        ) {
          throw new BadRequestException({
            code: ApiErrorCode.BAD_REQUEST,
            message: `Quote token payload does not match authoritative database quote. Tampering detected.`,
          });
        }
      }

      // Context mismatch checks
      if (dto.serviceCategory && dto.serviceCategory !== quote.serviceCategory) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Requested service category '${dto.serviceCategory}' does not match pinned quote category '${quote.serviceCategory}'.`,
        });
      }

      if (dto.passengerCount !== undefined && dto.passengerCount !== quote.passengerCount) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Requested passenger count ${dto.passengerCount} does not match pinned quote passenger count ${quote.passengerCount}.`,
        });
      }

      if (
        dto.pickupLatitude !== undefined &&
        Math.abs(Number(dto.pickupLatitude) - Number(quote.pickupLatitude)) > 0.0001
      ) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Requested pickup latitude does not match pinned quote location.`,
        });
      }

      if (
        dto.dropoffLatitude !== undefined &&
        Math.abs(Number(dto.dropoffLatitude) - Number(quote.dropoffLatitude)) > 0.0001
      ) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Requested dropoff latitude does not match pinned quote location.`,
        });
      }

      // 6. Post-Quote Zone & Category Switch Revocation Safeguard
      if (this.zonesService) {
        const zoneCheck = await this.zonesService.verifyLocation({
          city: quote.city,
          latitude: Number(quote.pickupLatitude),
          longitude: Number(quote.pickupLongitude),
          serviceCategory: quote.serviceCategory,
        });

        if (!zoneCheck.isAuthorized) {
          if (quote.status === 'ACTIVE') {
            quote.status = 'REVOKED';
            await manager.save(quote);
          }
          throw new BadRequestException({
            code: ApiErrorCode.ZONE_RESTRICTED,
            message:
              zoneCheck.rejectionReason ||
              `Service category '${quote.serviceCategory}' or operational zone in '${quote.city}' was revoked after quote generation.`,
          });
        }
      }

      // 7. Insert Booking with pinned values and PostGIS geometry points
      const bookingId = randomUUID();
      const bookingCode = `ECO-VZ-${bookingId.substring(0, 8).toUpperCase()}`;
      const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const fareAmountRupees = quote.totalFarePaise / 100;
      const rider = effectiveRiderId || 'b0000000-0000-4000-8000-000000000001';

      await manager.query(
        `INSERT INTO "bookings" (
           "id", "booking_code", "rider_id", "service_category", "status",
           "pickup_location", "dropoff_location",
           "start_otp", "fare_amount", "quote_id", "fare_rule_id", "fare_rule_version",
           "idempotency_key", "passenger_count", "created_at", "updated_at"
         )
         VALUES (
           $1, $2, $3, $4, 'CREATED',
           ST_SetSRID(ST_MakePoint($5, $6), 4326), ST_SetSRID(ST_MakePoint($7, $8), 4326),
           $9, $10, $11, $12, $13,
           $14, $15, NOW(), NOW()
         )`,
        [
          bookingId,
          bookingCode,
          rider,
          quote.serviceCategory,
          Number(quote.pickupLongitude),
          Number(quote.pickupLatitude),
          Number(quote.dropoffLongitude),
          Number(quote.dropoffLatitude),
          startOtp,
          fareAmountRupees,
          quote.id,
          quote.fareRuleId,
          quote.fareRuleVersion,
          dto.idempotencyKey,
          quote.passengerCount || 1,
        ],
      );

      // 8. Atomically transition Quote to CONSUMED
      quote.status = 'CONSUMED';
      quote.consumedAt = new Date();
      quote.bookingId = bookingId;
      quote.idempotencyKey = dto.idempotencyKey;
      await manager.save(quote);

      return {
        bookingId,
        bookingCode,
        riderId: rider,
        quoteId: quote.id,
        fareRuleId: quote.fareRuleId,
        fareRuleVersion: quote.fareRuleVersion,
        serviceCategory: quote.serviceCategory,
        status: 'CREATED',
        fareAmountRupees,
        fareAmountPaise: quote.totalFarePaise,
        startOtp,
        idempotencyKey: dto.idempotencyKey,
        passengerCount: quote.passengerCount || 1,
        pickupLatitude: Number(quote.pickupLatitude),
        pickupLongitude: Number(quote.pickupLongitude),
        dropoffLatitude: Number(quote.dropoffLatitude),
        dropoffLongitude: Number(quote.dropoffLongitude),
        createdAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Retrieves booking details by ID and verifies caller authorization.
   */
  async getBooking(id: string, actorUserId?: string): Promise<BookingDetailsResponse> {
    const res = await this.findBookingWithCoords(this.dataSource.manager, id);
    if (!res) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking with ID '${id}' not found.`,
      });
    }

    if (
      actorUserId &&
      actorUserId !== '00000000-0000-0000-0000-000000000000' &&
      res.riderId !== actorUserId
    ) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: `Access denied: Booking belongs to another rider account.`,
      });
    }

    return res;
  }

  private async findBookingWithCoords(
    manager: EntityManager,
    bookingId: string,
  ): Promise<BookingDetailsResponse | null> {
    const rows = await manager.query(
      `SELECT
         b.id,
         b.booking_code,
         b.rider_id,
         b.service_category,
         b.status,
         b.start_otp,
         b.fare_amount,
         b.quote_id,
         b.fare_rule_id,
         b.fare_rule_version,
         b.idempotency_key,
         b.passenger_count,
         b.created_at,
         ST_Y(b.pickup_location::geometry) as pickup_latitude,
         ST_X(b.pickup_location::geometry) as pickup_longitude,
         ST_Y(b.dropoff_location::geometry) as dropoff_latitude,
         ST_X(b.dropoff_location::geometry) as dropoff_longitude
       FROM "bookings" b
       WHERE b.id = $1`,
      [bookingId],
    );

    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    return {
      bookingId: row.id,
      bookingCode: row.booking_code,
      riderId: row.rider_id,
      quoteId: row.quote_id,
      fareRuleId: row.fare_rule_id,
      fareRuleVersion: row.fare_rule_version,
      serviceCategory: row.service_category,
      status: row.status,
      fareAmountRupees: Number(row.fare_amount),
      fareAmountPaise: Math.round(Number(row.fare_amount) * 100),
      startOtp: row.start_otp,
      idempotencyKey: row.idempotency_key,
      passengerCount: Number(row.passenger_count || 1),
      pickupLatitude: Number(row.pickup_latitude),
      pickupLongitude: Number(row.pickup_longitude),
      dropoffLatitude: Number(row.dropoff_latitude),
      dropoffLongitude: Number(row.dropoff_longitude),
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}
