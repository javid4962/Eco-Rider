import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiErrorCode,
  paiseToRupees,
  FareCalculationBreakdown,
  StoredRideQuote,
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
import { randomUUID } from 'crypto';

export interface QuoteResult {
  quoteId: string;
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

    // 4. Persist quote to database for immutability and audit retention
    if (this.rideQuoteRepo && activeRule) {
      const entity = new RideQuote();
      entity.id = quote.quoteId;
      entity.city = quote.city;
      entity.serviceCategory = quote.serviceCategory;
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
      entity.expiresAt = new Date(quote.expiresAt);

      await this.rideQuoteRepo.save(entity);
    }

    return quote;
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
        quote.serviceCategory === 'SHARED_SHUTTLE_4W'
          ? VehicleServiceClass.ECO_VAN
          : CATEGORY_TO_SERVICE_CLASS[quote.serviceCategory as VehicleCategory] ||
            VehicleServiceClass.ECO_BIKE,
      passengerCount: quote.fareBreakdown?.passengerCount ?? 1,
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
      expiresAt: quote.expiresAt.toISOString(),
      createdAt: quote.createdAt.toISOString(),
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

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
