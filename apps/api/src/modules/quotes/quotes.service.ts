import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiErrorCode,
  paiseToRupees,
  FareCalculationBreakdown,
  StoredRideQuote,
} from '@ecoride/contracts';
import { QuoteRequestDto } from '../../common/dto/quote-request.dto';
import { ZonesService } from '../zones/zones.service';
import { FareRulesService } from '../fare-rules/fare-rules.service';
import { FareRule } from '../../database/entities/fare-rule.entity';
import { RideQuote } from '../../database/entities/ride-quote.entity';
import { randomUUID } from 'crypto';

export interface QuoteResult {
  quoteId: string;
  city: string;
  serviceCategory: string;
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
  ) {}

  /**
   * Authoritatively evaluates PostGIS polygonal geofence, service category switches,
   * and versioned server-side fare rules before computing distance, duration, taxes, and fare.
   * Persists the resulting quote with its immutable fare rule version snapshot.
   */
  async calculateAuthoritativeQuote(
    dto: QuoteRequestDto & { clientForgedAvailability?: boolean },
  ): Promise<QuoteResult> {
    if (this.zonesService) {
      const verification = await this.zonesService.verifyLocation({
        city: dto.city,
        latitude: dto.pickupLatitude,
        longitude: dto.pickupLongitude,
        serviceCategory: dto.serviceCategory,
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
      activeRule = await this.fareRulesService.getActiveRule(dto.city, dto.serviceCategory);

      if (!activeRule) {
        throw new BadRequestException({
          code: ApiErrorCode.NO_ACTIVE_FARE_RULE,
          message: `No approved active fare rule found for city '${dto.city}' and category '${dto.serviceCategory}'. Source PDF illustrative fares are not live defaults.`,
        });
      }
    }

    // 2. Calculate fare with active rule
    const quote = this.calculateQuote(dto, activeRule || undefined);

    // 3. Persist quote to database for immutability and audit retention
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
      entity.waitingMinutes = 0;
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
   * Calculates EV fare quote. Supports explicit active FareRule or default approved pilot baseline.
   */
  calculateQuote(dto: QuoteRequestDto, activeRule?: FareRule): QuoteResult {
    const city = dto.city.toLowerCase().trim();

    // 1. Enforce Andhra Pradesh pilot zone bounds
    if (city !== 'visakhapatnam') {
      throw new BadRequestException({
        code: ApiErrorCode.ZONE_RESTRICTED,
        message: `City '${dto.city}' is outside the authorized Release A pilot zone. Only Visakhapatnam is active.`,
      });
    }

    // 2. Enforce Service Category availability
    const allowedCategories = ['CITY_COMMUTE_2W', 'SHARED_SHUTTLE_4W'];
    if (!allowedCategories.includes(dto.serviceCategory)) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Service category '${dto.serviceCategory}' is not permitted in active pilot release.`,
      });
    }

    // 3. Compute spherical distance (Haversine)
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
    const distanceMeters = Math.max(500, Math.round(R * c));
    const distanceKm = distanceMeters / 1000;
    const durationMinutes = Math.max(3, Math.round(distanceKm * 3));

    // 4. Rate components from activeRule or approved pilot defaults
    const baseFarePaise = activeRule ? activeRule.baseFarePaise : 2500;
    const baseDistanceMeters = activeRule ? activeRule.baseDistanceMeters : 1000;
    const perKmRatePaise = activeRule ? activeRule.perKmRatePaise : 800;
    const perMinuteRatePaise = activeRule ? activeRule.perMinuteRatePaise : 0;
    const waitingChargePaisePerMinute = activeRule ? activeRule.waitingChargePaisePerMinute : 0;
    const minimumFarePaise = activeRule ? activeRule.minimumFarePaise : 2500;
    const surgeMultiplier = activeRule ? Number(activeRule.surgeMultiplier) : 1.0;
    const taxRateBps = activeRule ? activeRule.taxRateBps : 500; // 5% GST

    // 5. Compute components in integer paise
    const waitingMinutes = (dto as { waitingMinutes?: number }).waitingMinutes || 0;
    const distanceBeyondBaseKm = Math.max(0, (distanceMeters - baseDistanceMeters) / 1000);
    const distanceFarePaise = Math.round(distanceBeyondBaseKm * perKmRatePaise);
    const timeFarePaise = Math.round(durationMinutes * perMinuteRatePaise);
    const waitingFarePaise = Math.round(waitingMinutes * waitingChargePaisePerMinute);

    const subtotalPaise = baseFarePaise + distanceFarePaise + timeFarePaise + waitingFarePaise;
    const surgedSubtotalPaise = Math.round(subtotalPaise * surgeMultiplier);

    // 6. Promotions / Coupon discounts
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

    const netTaxablePaise = Math.max(surgedSubtotalPaise - discountPaise, minimumFarePaise);

    // 7. Andhra Pradesh GST Breakdown (5% passenger transport: 2.5% CGST + 2.5% SGST)
    const taxPaise = Math.round((netTaxablePaise * taxRateBps) / 10000);
    const cgstPaise = Math.floor(taxPaise / 2);
    const sgstPaise = taxPaise - cgstPaise;

    const totalFarePaise = netTaxablePaise + taxPaise;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const breakdown: FareCalculationBreakdown = {
      baseFarePaise,
      distanceFarePaise,
      timeFarePaise,
      waitingFarePaise,
      subtotalPaise,
      surgeMultiplier,
      surgedSubtotalPaise,
      taxPaise,
      taxes: {
        cgstPaise,
        sgstPaise,
        totalTaxPaise: taxPaise,
      },
      discountPaise,
      totalPaise: totalFarePaise,
      currency: 'INR',
      formattedRupees: `₹${paiseToRupees(totalFarePaise).toFixed(2)}`,
    };

    return {
      quoteId: randomUUID(),
      city: city,
      serviceCategory: dto.serviceCategory,
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
