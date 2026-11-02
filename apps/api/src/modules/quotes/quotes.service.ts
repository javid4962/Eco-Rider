import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { ApiErrorCode, paiseToRupees } from '@ecoride/contracts';
import { QuoteRequestDto } from '../../common/dto/quote-request.dto';
import { ZonesService } from '../zones/zones.service';
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
  etaMinutes: number;
  propulsion: 'BATTERY_ELECTRIC';
  expiresAt: string;
}

@Injectable()
export class QuotesService {
  constructor(
    @Optional()
    private readonly zonesService?: ZonesService,
  ) {}

  /**
   * Authoritatively evaluates PostGIS polygonal geofence and service category switches
   * before computing ride distance and fare estimate.
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

    return this.calculateQuote(dto);
  }

  calculateQuote(dto: QuoteRequestDto): QuoteResult {
    // 1. Enforce Andhra Pradesh pilot zone bounds
    if (dto.city.toLowerCase() !== 'visakhapatnam') {
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

    // 4. Calculate EV fare in integer paise (base fare 2500 paise = ₹25 + 800 paise/km)
    const distanceKm = distanceMeters / 1000;
    const baseFarePaise = 2500;
    const distanceFarePaise = Math.round(distanceKm * 800);
    const amountPaise = baseFarePaise + distanceFarePaise;

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

    return {
      quoteId: randomUUID(),
      city: dto.city.toLowerCase(),
      serviceCategory: dto.serviceCategory,
      distanceMeters,
      fare: {
        amountPaise,
        currency: 'INR',
        formattedRupees: `₹${paiseToRupees(amountPaise).toFixed(2)}`,
      },
      etaMinutes: Math.max(3, Math.round(distanceKm * 3)),
      propulsion: 'BATTERY_ELECTRIC',
      expiresAt,
    };
  }
}
