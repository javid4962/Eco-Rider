import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiErrorCode,
  paiseToRupees,
  FareCalculationBreakdown,
  StoredRideQuote,
  QuoteStatus,
  QuoteTokenPayload,
  QuoteEligibilityResult,
  VehicleCategory,
  VehicleServiceClass,
  CATEGORY_TO_SERVICE_CLASS,
  SERVICE_CLASS_TO_CATEGORY,
} from '@ecoride/contracts';
import { QuoteRequestDto } from '../../common/dto/quote-request.dto';
import { ZonesService } from '../zones/zones.service';
import { FareRulesService } from '../fare-rules/fare-rules.service';
import { MapsService } from '../maps/maps.service';
import { FareRule } from '../../database/entities/fare-rule.entity';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';

export interface QuoteResult {
  quoteId: string;
  quoteToken?: string;
  status?: string;
  riderId?: string | null;
  city: string;
  serviceCategory: string;
  vehicleClass?: string;
  passengerCount?: number;
  distanceMeters: number;
  fare: {
    amountPaise: number;
    currency: 'INR';
    formattedRupees: string;
  };
  fareRuleId?: string;
  fareRuleVersion?: number;
  fareBreakdown?: FareCalculationBreakdown;
  appliedPromoCode?: string | null;
  etaMinutes: number;
  propulsion: 'BATTERY_ELECTRIC';
  expiresAt: string;
}

@Injectable()
export class QuotesService {
  private readonly quoteSecret =
    process.env.QUOTE_SECRET ||
    process.env.JWT_SECRET ||
    'ecoride-ev-quote-token-safeguard-secret-ap-2026';

  constructor(
    @Optional()
    private readonly zonesService?: ZonesService,
    @Optional()
    private readonly fareRulesService?: FareRulesService,
    @Optional()
    @InjectRepository(RideQuote)
    private readonly rideQuoteRepo?: Repository<RideQuote>,
    @Optional()
    private readonly mapsService?: MapsService,
  ) {}

  /**
   * Generates a tamper-proof cryptographically signed quote token pinning
   * fare policy version, origin, destination, service category, passenger count, and pricing.
   */
  public generateQuoteToken(payload: QuoteTokenPayload): string {
    const payloadJson = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadJson, 'utf8').toString('base64url');
    const signature = createHmac('sha256', this.quoteSecret).update(payloadB64).digest('base64url');
    return `${payloadB64}.${signature}`;
  }

  /**
   * Verifies the cryptographic HMAC signature and integrity of a quote token.
   */
  public verifyQuoteToken(token: string): {
    isValid: boolean;
    payload?: QuoteTokenPayload;
    reason?: string;
  } {
    if (!token || typeof token !== 'string') {
      return { isValid: false, reason: 'Token is missing or invalid format' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return { isValid: false, reason: 'Invalid token structure' };
    }

    const [payloadB64, signature] = parts;
    const expectedSignature = createHmac('sha256', this.quoteSecret)
      .update(payloadB64)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSignature, 'utf8');

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return { isValid: false, reason: 'TAMPERED_SIGNATURE' };
    }

    try {
      const payload: QuoteTokenPayload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      );

      if (new Date(payload.expiresAt).getTime() <= Date.now()) {
        return { isValid: false, payload, reason: 'EXPIRED' };
      }

      return { isValid: true, payload };
    } catch {
      return { isValid: false, reason: 'MALFORMED_PAYLOAD' };
    }
  }

  /**
   * Validates and resolves vehicle class, commercial service category,
   * and seating capacity limits strictly accounting for the driver separately.
   */
  public validateAndResolveVehicleAndCategory(dto: QuoteRequestDto): {
    serviceCategory: string;
    vehicleClass: string;
    passengerCount: number;
  } {
    const CATEGORY_MAX_PASSENGERS: Record<string, number> = {
      [VehicleCategory.CITY_COMMUTE_2W]: 1, // D+1 (1 customer seat)
      [VehicleCategory.AUTO_COMMUTE_3W]: 3, // D+3 (3 customer seats)
      [VehicleCategory.CAB_PRIVATE_4W]: 4, // D+4 (4 customer seats)
      [VehicleCategory.VAN_COMMUTE_4W]: 10, // D+10 (5-10 customer seats)
      SHARED_SHUTTLE_4W: 10, // D+10 shared EV shuttle
    };

    let serviceCategory = dto.serviceCategory;
    let vehicleClass = dto.vehicleClass;

    if (!serviceCategory && vehicleClass) {
      if (vehicleClass === VehicleServiceClass.ECO_VAN) {
        serviceCategory = 'SHARED_SHUTTLE_4W';
      } else {
        serviceCategory = SERVICE_CLASS_TO_CATEGORY[vehicleClass as VehicleServiceClass];
      }
    }

    if (!serviceCategory) {
      serviceCategory = VehicleCategory.CITY_COMMUTE_2W;
    }

    if (!vehicleClass) {
      if (serviceCategory === 'SHARED_SHUTTLE_4W') {
        vehicleClass = VehicleServiceClass.ECO_VAN;
      } else {
        vehicleClass =
          CATEGORY_TO_SERVICE_CLASS[serviceCategory as VehicleCategory] ||
          VehicleServiceClass.ECO_BIKE;
      }
    }

    // Check compatibility when both are explicitly provided
    if (dto.vehicleClass && dto.serviceCategory) {
      const isCompat =
        (dto.vehicleClass === VehicleServiceClass.ECO_BIKE &&
          dto.serviceCategory === VehicleCategory.CITY_COMMUTE_2W) ||
        (dto.vehicleClass === VehicleServiceClass.ECO_AUTO &&
          dto.serviceCategory === VehicleCategory.AUTO_COMMUTE_3W) ||
        (dto.vehicleClass === VehicleServiceClass.ECO_CAB &&
          dto.serviceCategory === VehicleCategory.CAB_PRIVATE_4W) ||
        (dto.vehicleClass === VehicleServiceClass.ECO_VAN &&
          (dto.serviceCategory === VehicleCategory.VAN_COMMUTE_4W ||
            dto.serviceCategory === 'SHARED_SHUTTLE_4W'));

      if (!isCompat) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Vehicle class '${dto.vehicleClass}' is incompatible with requested service category '${dto.serviceCategory}'.`,
        });
      }
    }

    // Validate legal passenger capacity
    const passengerCount =
      dto.passengerCount !== undefined && dto.passengerCount !== null
        ? Number(dto.passengerCount)
        : 1;

    const maxAllowed = CATEGORY_MAX_PASSENGERS[serviceCategory] ?? 4;
    if (passengerCount < 1 || passengerCount > maxAllowed) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Passenger count ${passengerCount} exceeds legal passenger capacity of ${maxAllowed} for '${serviceCategory}'.`,
      });
    }

    return { serviceCategory, vehicleClass, passengerCount };
  }

  /**
   * Authoritatively evaluates PostGIS polygonal geofence, service category switches,
   * route estimation with fallback rules, and versioned server-side fare rules
   * before computing distance, duration, taxes, and fare.
   * Persists the resulting quote with its immutable fare rule version snapshot.
   */
  async calculateAuthoritativeQuote(
    dto: QuoteRequestDto & { clientForgedAvailability?: boolean },
    actorUserId?: string,
  ): Promise<QuoteResult> {
    const { serviceCategory, vehicleClass, passengerCount } =
      this.validateAndResolveVehicleAndCategory(dto);

    if (this.zonesService) {
      const verification = await this.zonesService.verifyLocation({
        city: dto.city,
        latitude: dto.pickupLatitude,
        longitude: dto.pickupLongitude,
        serviceCategory,
        clientForgedAvailability: dto.clientForgedAvailability,
      });

      if (!verification.isAuthorized) {
        throw new BadRequestException({
          code: ApiErrorCode.ZONE_RESTRICTED,
          message:
            verification.rejectionReason ||
            `Location is not authorized in service zones for '${dto.city}'.`,
        });
      }
    }

    // 1. Resolve active approved fare rule
    let activeRule: FareRule | null = null;
    if (this.fareRulesService) {
      activeRule = await this.fareRulesService.getActiveRule(dto.city, serviceCategory);

      if (!activeRule) {
        throw new BadRequestException({
          code: ApiErrorCode.NO_ACTIVE_FARE_RULE,
          message: `No approved active fare rule found for city '${dto.city}' and category '${serviceCategory}'. Source PDF illustrative fares are not live defaults.`,
        });
      }
    }

    // 2. Obtain route estimate with provider resilience and fallback rules
    let routeEstimate:
      { distanceMeters: number; durationMinutes: number; isFallback: boolean } | undefined;

    if (this.mapsService) {
      if (dto.simulateProviderDowntime) {
        const offline = this.mapsService.getOfflineRouteCalculation(
          {
            origin: { latitude: dto.pickupLatitude, longitude: dto.pickupLongitude },
            destination: { latitude: dto.dropoffLatitude, longitude: dto.dropoffLongitude },
            serviceCategory,
          },
          'Simulated provider downtime for test resilience',
        );
        routeEstimate = {
          distanceMeters: offline.distanceMeters,
          durationMinutes: offline.etaMinutes,
          isFallback: true,
        };
      } else {
        try {
          const routeResp = await this.mapsService.calculateRoute({
            origin: { latitude: dto.pickupLatitude, longitude: dto.pickupLongitude },
            destination: { latitude: dto.dropoffLatitude, longitude: dto.dropoffLongitude },
            serviceCategory,
          });
          routeEstimate = {
            distanceMeters: routeResp.distanceMeters,
            durationMinutes: routeResp.etaMinutes,
            isFallback: routeResp.isFallback,
          };
        } catch {
          const offline = this.mapsService.getOfflineRouteCalculation(
            {
              origin: { latitude: dto.pickupLatitude, longitude: dto.pickupLongitude },
              destination: { latitude: dto.dropoffLatitude, longitude: dto.dropoffLongitude },
              serviceCategory,
            },
            'Provider downtime fallback',
          );
          routeEstimate = {
            distanceMeters: offline.distanceMeters,
            durationMinutes: offline.etaMinutes,
            isFallback: true,
          };
        }
      }
    }

    // 3. Calculate fare with active rule and route estimate
    const quote = this.calculateQuote(
      {
        ...dto,
        serviceCategory,
        vehicleClass,
        passengerCount,
      },
      activeRule || undefined,
      routeEstimate,
    );

    const riderId = actorUserId || dto.riderId || null;

    // 4. Generate cryptographic tamper-proof token pinning policy, geography, and context
    const tokenPayload: QuoteTokenPayload = {
      quoteId: quote.quoteId,
      riderId,
      city: quote.city,
      serviceCategory: quote.serviceCategory,
      vehicleClass,
      passengerCount,
      pickupLatitude: dto.pickupLatitude,
      pickupLongitude: dto.pickupLongitude,
      dropoffLatitude: dto.dropoffLatitude,
      dropoffLongitude: dto.dropoffLongitude,
      fareRuleId: activeRule?.id || '',
      fareRuleVersion: activeRule?.version || 1,
      totalFarePaise: quote.fare.amountPaise,
      expiresAt: quote.expiresAt,
    };
    const quoteToken = this.generateQuoteToken(tokenPayload);

    // 5. Persist quote to database for immutability and audit retention
    if (this.rideQuoteRepo && activeRule) {
      const entity = new RideQuote();
      entity.id = quote.quoteId;
      entity.riderId = riderId;
      entity.city = quote.city;
      entity.serviceCategory = quote.serviceCategory;
      entity.vehicleClass = vehicleClass;
      entity.passengerCount = passengerCount;
      entity.pickupLatitude = dto.pickupLatitude;
      entity.pickupLongitude = dto.pickupLongitude;
      entity.dropoffLatitude = dto.dropoffLatitude;
      entity.dropoffLongitude = dto.dropoffLongitude;
      entity.distanceMeters = quote.distanceMeters;
      entity.durationMinutes = quote.etaMinutes;
      entity.waitingMinutes = dto.waitingMinutes || 0;
      entity.fareRuleId = activeRule.id;
      entity.fareRuleVersion = activeRule.version;
      entity.fareBreakdown = quote.fareBreakdown!;
      entity.totalFarePaise = quote.fare.amountPaise;
      entity.appliedPromoCode = quote.appliedPromoCode || null;
      entity.currency = 'INR';
      entity.propulsion = 'BATTERY_ELECTRIC';
      entity.quoteToken = quoteToken;
      entity.status = 'ACTIVE';
      entity.expiresAt = new Date(quote.expiresAt);

      await this.rideQuoteRepo.save(entity);
    }

    return {
      ...quote,
      quoteToken,
      status: 'ACTIVE',
      riderId,
      vehicleClass,
      passengerCount,
    };
  }

  /**
   * Retrieves an existing quote by UUID.
   * Guarantees that old ride quotes retain their original price version and snapshot.
   */
  async getQuote(id: string): Promise<StoredRideQuote> {
    if (!this.rideQuoteRepo) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Quote with ID '${id}' not found.`,
      });
    }

    const quote = await this.rideQuoteRepo.findOne({ where: { id } });
    if (!quote) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Quote with ID '${id}' not found.`,
      });
    }

    return {
      id: quote.id,
      riderId: quote.riderId,
      city: quote.city,
      serviceCategory: quote.serviceCategory,
      vehicleClass:
        quote.vehicleClass ||
        (quote.serviceCategory === 'SHARED_SHUTTLE_4W'
          ? VehicleServiceClass.ECO_VAN
          : CATEGORY_TO_SERVICE_CLASS[quote.serviceCategory as VehicleCategory] ||
            VehicleServiceClass.ECO_BIKE),
      passengerCount: quote.passengerCount ?? quote.fareBreakdown?.passengerCount ?? 1,
      pickupLatitude: Number(quote.pickupLatitude),
      pickupLongitude: Number(quote.pickupLongitude),
      dropoffLatitude: Number(quote.dropoffLatitude),
      dropoffLongitude: Number(quote.dropoffLongitude),
      distanceMeters: quote.distanceMeters,
      durationMinutes: quote.durationMinutes,
      waitingMinutes: quote.waitingMinutes,
      fareRuleId: quote.fareRuleId,
      fareRuleVersion: quote.fareRuleVersion,
      fareBreakdown: quote.fareBreakdown,
      totalFarePaise: quote.totalFarePaise,
      appliedPromoCode: quote.appliedPromoCode,
      currency: 'INR',
      propulsion: 'BATTERY_ELECTRIC',
      quoteToken: quote.quoteToken,
      status: (quote.status as QuoteStatus) || 'ACTIVE',
      consumedAt: quote.consumedAt ? quote.consumedAt.toISOString() : null,
      bookingId: quote.bookingId || null,
      idempotencyKey: quote.idempotencyKey || null,
      expiresAt: quote.expiresAt.toISOString(),
      createdAt: quote.createdAt.toISOString(),
    };
  }

  /**
   * Verifies quote eligibility, cryptographic signature, lifecycle status,
   * account ownership, and post-quote zone authorizations.
   */
  async verifyQuoteEligibility(
    quoteId: string,
    actorUserId?: string,
    context?: {
      quoteToken?: string;
      pickupLatitude?: number;
      pickupLongitude?: number;
      dropoffLatitude?: number;
      dropoffLongitude?: number;
      serviceCategory?: string;
      passengerCount?: number;
    },
  ): Promise<QuoteEligibilityResult> {
    if (!this.rideQuoteRepo) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Quote '${quoteId}' not found.`,
      });
    }

    const quote = await this.rideQuoteRepo.findOne({ where: { id: quoteId } });
    if (!quote) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Quote '${quoteId}' not found.`,
      });
    }

    // 1. Cross-account access check
    if (quote.riderId && actorUserId && quote.riderId !== actorUserId) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: `Access denied: Quote belongs to rider '${quote.riderId}'. Cross-account ride booking is strictly prohibited.`,
      });
    }

    // 2. Lifecycle status: Consumed
    if (quote.status === 'CONSUMED') {
      throw new ConflictException({
        code: ApiErrorCode.CONFLICT,
        message: `Quote '${quoteId}' has already been consumed for booking '${quote.bookingId}'. Replaying quotes across multiple bookings is prohibited.`,
      });
    }

    // 3. Expiry check
    const isExpired = new Date(quote.expiresAt).getTime() <= Date.now();
    if (isExpired) {
      if (quote.status === 'ACTIVE') {
        quote.status = 'EXPIRED';
        await this.rideQuoteRepo.save(quote);
      }
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Quote '${quoteId}' expired at ${quote.expiresAt.toISOString()}. Please request a fresh fare quote.`,
      });
    }

    // 4. Cryptographic HMAC token verification (if supplied)
    if (context?.quoteToken) {
      const verification = this.verifyQuoteToken(context.quoteToken);
      if (!verification.isValid || !verification.payload) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Quote token is invalid or tampered: ${verification.reason || 'TAMPERED_SIGNATURE'}. Client-side fare overrides are strictly rejected.`,
        });
      }

      const p = verification.payload;
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
          message: `Quote token payload does not match authoritative database record. Tampering detected.`,
        });
      }
    }

    // 5. Context mismatch check
    if (context?.serviceCategory && context.serviceCategory !== quote.serviceCategory) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Requested service category '${context.serviceCategory}' does not match pinned quote category '${quote.serviceCategory}'.`,
      });
    }

    if (context?.passengerCount && context.passengerCount !== quote.passengerCount) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Requested passenger count ${context.passengerCount} does not match pinned quote passenger count ${quote.passengerCount}.`,
      });
    }

    if (
      context?.pickupLatitude !== undefined &&
      Math.abs(Number(context.pickupLatitude) - Number(quote.pickupLatitude)) > 0.0001
    ) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Requested pickup latitude does not match pinned quote location.`,
      });
    }

    if (
      context?.dropoffLatitude !== undefined &&
      Math.abs(Number(context.dropoffLatitude) - Number(quote.dropoffLatitude)) > 0.0001
    ) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Requested dropoff latitude does not match pinned quote location.`,
      });
    }

    // 6. Post-quote Zone and Category switch revocation check
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
          await this.rideQuoteRepo.save(quote);
        }
        throw new BadRequestException({
          code: ApiErrorCode.ZONE_RESTRICTED,
          message:
            zoneCheck.rejectionReason ||
            `Service category '${quote.serviceCategory}' or operational zone in '${quote.city}' was revoked after quote generation.`,
        });
      }
    }

    return {
      isEligible: true,
      quoteId: quote.id,
      status: quote.status as QuoteStatus,
      expiresAt: quote.expiresAt.toISOString(),
      isExpired: false,
      isConsumed: false,
      isRevoked: false,
      isCrossAccount: false,
      isTampered: false,
    };
  }

  /**
   * Calculates EV fare quote with deterministic integer-paise arithmetic,
   * passenger seat scaling, platform fees, taxes, and nearest-rupee rounding.
   * Client-supplied fare is strictly ignored to prevent tampering.
   */
  calculateQuote(
    dto: QuoteRequestDto,
    activeRule?: FareRule,
    routeEstimate?: { distanceMeters: number; durationMinutes: number; isFallback?: boolean },
  ): QuoteResult {
    const city = dto.city.toLowerCase().trim();

    // 1. Enforce Andhra Pradesh pilot zone bounds
    if (city !== 'visakhapatnam') {
      throw new BadRequestException({
        code: ApiErrorCode.ZONE_RESTRICTED,
        message: `City '${dto.city}' is outside the authorized Release A pilot zone. Only Visakhapatnam is active.`,
      });
    }

    // 2. Validate Vehicle Class, Service Category, and Passenger Count
    const { serviceCategory, vehicleClass, passengerCount } =
      this.validateAndResolveVehicleAndCategory(dto);

    // 3. Enforce Service Category availability in pilot release
    const allowedCategories = ['CITY_COMMUTE_2W', 'SHARED_SHUTTLE_4W'];
    if (!allowedCategories.includes(serviceCategory)) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Service category '${serviceCategory}' is not permitted in active pilot release.`,
      });
    }

    // 4. Resolve Distance and Duration (routeEstimate or spherical Haversine fallback)
    let distanceMeters: number;
    let durationMinutes: number;
    let isFallback = false;

    if (routeEstimate) {
      distanceMeters = routeEstimate.distanceMeters;
      durationMinutes = routeEstimate.durationMinutes;
      isFallback = Boolean(routeEstimate.isFallback);
    } else {
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const R = 6371000; // Earth radius in meters
      const dLat = toRad(dto.dropoffLatitude - dto.pickupLatitude);
      const dLon = toRad(dto.dropoffLongitude - dto.pickupLongitude);
      const lat1 = toRad(dto.pickupLatitude);
      const lat2 = toRad(dto.dropoffLatitude);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceMeters = Math.max(500, Math.round(R * c));
      const distanceKm = distanceMeters / 1000;
      durationMinutes = Math.max(3, Math.round(distanceKm * 3));
      isFallback = true;
    }

    // 5. Rate components from activeRule or approved pilot defaults
    const isShuttle = serviceCategory === 'SHARED_SHUTTLE_4W';
    const defaultBaseFare = isShuttle ? 3500 : 2500;
    const defaultBaseDistance = isShuttle ? 2000 : 1000;
    const defaultPerKm = isShuttle ? 600 : 800;
    const defaultPerMin = isShuttle ? 50 : 100;
    const defaultWaitingPerMin = isShuttle ? 50 : 100;
    const defaultMinFare = isShuttle ? 3500 : 2500;

    const baseFarePaise = activeRule ? activeRule.baseFarePaise : defaultBaseFare;
    const baseDistanceMeters = activeRule ? activeRule.baseDistanceMeters : defaultBaseDistance;
    const perKmRatePaise = activeRule ? activeRule.perKmRatePaise : defaultPerKm;
    const perMinuteRatePaise = activeRule ? activeRule.perMinuteRatePaise : defaultPerMin;
    const waitingChargePaisePerMinute = activeRule
      ? activeRule.waitingChargePaisePerMinute
      : defaultWaitingPerMin;
    const minimumFarePaise = activeRule ? activeRule.minimumFarePaise : defaultMinFare;
    const surgeMultiplier = activeRule ? Number(activeRule.surgeMultiplier) : 1.0;
    const taxRateBps = activeRule ? activeRule.taxRateBps : 500; // 5% GST

    // 6. Compute distance and time fare in integer paise
    const waitingMinutes = dto.waitingMinutes || 0;
    const distanceBeyondBaseKm = Math.max(0, (distanceMeters - baseDistanceMeters) / 1000);
    const distanceFarePaise = Math.round(distanceBeyondBaseKm * perKmRatePaise);
    const timeFarePaise = Math.round(durationMinutes * perMinuteRatePaise);
    const waitingFarePaise = Math.round(waitingMinutes * waitingChargePaisePerMinute);

    const unitFarePaise = baseFarePaise + distanceFarePaise + timeFarePaise + waitingFarePaise;

    // For shared shuttle: subtotal is per seat * passengerCount; for private ride: unit ride fare
    const subtotalPaise = isShuttle ? unitFarePaise * passengerCount : unitFarePaise;
    const surgedSubtotalPaise = Math.round(subtotalPaise * surgeMultiplier);

    // 7. Promotions / Coupon discounts
    let discountPaise = 0;
    let appliedPromo: string | null = null;
    if (dto.promoCode && activeRule?.promotions) {
      const now = new Date();
      const promo = activeRule.promotions.find(
        (p) =>
          p.promoCode.toUpperCase() === dto.promoCode!.toUpperCase().trim() &&
          new Date(p.validFrom) <= now &&
          new Date(p.validTo) >= now,
      );

      if (promo) {
        const minTrip = promo.minTripFarePaise ?? 0;
        if (surgedSubtotalPaise >= minTrip) {
          const rawDiscount = Math.round(surgedSubtotalPaise * (promo.discountPercent / 100));
          discountPaise = Math.min(rawDiscount, promo.maxDiscountPaise);
          appliedPromo = promo.promoCode;
        }
      }
    }

    // Platform fee: ₹2.00 (200 paise)
    const platformFeePaise = 200;

    const minTripThreshold = isShuttle ? minimumFarePaise * passengerCount : minimumFarePaise;
    const baseTaxablePaise = Math.max(surgedSubtotalPaise - discountPaise, minTripThreshold);
    const netTaxablePaise = baseTaxablePaise + platformFeePaise;

    // 8. Andhra Pradesh GST Breakdown (5% passenger transport: 2.5% CGST + 2.5% SGST)
    const taxPaise = Math.round((netTaxablePaise * taxRateBps) / 10000);
    const cgstPaise = Math.floor(taxPaise / 2);
    const sgstPaise = taxPaise - cgstPaise;

    // 9. Unrounded total and whole-rupee rounding
    const unroundedTotalPaise = netTaxablePaise + taxPaise;
    const roundedTotalPaise = Math.round(unroundedTotalPaise / 100) * 100;
    const roundingDeltaPaise = roundedTotalPaise - unroundedTotalPaise;

    // Anti-tampering: Server value is authoritative; clientSuppliedFare is ignored
    const totalFarePaise = roundedTotalPaise;
    const validitySeconds =
      dto.expiresInSeconds && dto.expiresInSeconds > 0 ? dto.expiresInSeconds : 600;
    const expiresAt = new Date(Date.now() + validitySeconds * 1000).toISOString();

    const breakdown: FareCalculationBreakdown = {
      baseFarePaise,
      distanceFarePaise,
      timeFarePaise,
      waitingFarePaise,
      subtotalPaise,
      surgeMultiplier,
      surgedSubtotalPaise,
      platformFeePaise,
      passengerCount,
      ...(isShuttle ? { perPassengerFarePaise: unitFarePaise } : {}),
      taxPaise,
      taxes: {
        cgstPaise,
        sgstPaise,
        totalTaxPaise: taxPaise,
      },
      discountPaise,
      unroundedTotalPaise,
      roundingDeltaPaise,
      isRouteFallback: Boolean(isFallback),
      totalPaise: totalFarePaise,
      currency: 'INR',
      formattedRupees: `₹${paiseToRupees(totalFarePaise).toFixed(2)}`,
    };

    return {
      quoteId: randomUUID(),
      city,
      serviceCategory,
      vehicleClass,
      passengerCount,
      distanceMeters,
      fare: {
        amountPaise: totalFarePaise,
        currency: 'INR',
        formattedRupees: breakdown.formattedRupees,
      },
      fareRuleId: activeRule?.id,
      fareRuleVersion: activeRule?.version,
      fareBreakdown: breakdown,
      appliedPromoCode: appliedPromo,
      etaMinutes: durationMinutes,
      propulsion: 'BATTERY_ELECTRIC',
      expiresAt,
    };
  }
}
