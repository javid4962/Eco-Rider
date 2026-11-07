import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MultimodalFeederDiscountClaimEntity } from '../../database/entities/multimodal-feeder-discount-claim.entity';
import {
  FeederDiscountRequest,
  FeederDiscountCalculation,
  FeederDiscountClaim,
  TransitHubLocation,
} from '@ecoride/contracts';

const AP_TRANSIT_HUBS: Record<string, TransitHubLocation> = {
  BZA_STATION: {
    hubId: 'BZA_STATION',
    name: 'Vijayawada Junction Railway Station',
    type: 'RAILWAY_STATION',
    latitude: 16.5186,
    longitude: 80.6198,
    city: 'VIJAYAWADA',
  },
  BZA_PNBS: {
    hubId: 'BZA_PNBS',
    name: 'Pandit Nehru Bus Station (PNBS)',
    type: 'BUS_TERMINAL',
    latitude: 16.5074,
    longitude: 80.6277,
    city: 'VIJAYAWADA',
  },
  GNT_STATION: {
    hubId: 'GNT_STATION',
    name: 'Guntur Junction Railway Station',
    type: 'RAILWAY_STATION',
    latitude: 16.2995,
    longitude: 80.4438,
    city: 'GUNTUR',
  },
  AMR_SECRETARIAT: {
    hubId: 'AMR_SECRETARIAT',
    name: 'Amaravathi Transit Terminal',
    type: 'BUS_TERMINAL',
    latitude: 16.5417,
    longitude: 80.5152,
    city: 'AMARAVATHI',
  },
  MGL_AIIMS: {
    hubId: 'MGL_AIIMS',
    name: 'Mangalagiri AIIMS Transit Hub',
    type: 'METRO_STATION',
    latitude: 16.4357,
    longitude: 80.5638,
    city: 'MANGALAGIRI',
  },
};

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

@Injectable()
export class MultimodalFeederDiscountService {
  constructor(
    @InjectRepository(MultimodalFeederDiscountClaimEntity)
    private readonly claimRepo: Repository<MultimodalFeederDiscountClaimEntity>,
  ) {}

  calculateDiscount(req: FeederDiscountRequest): FeederDiscountCalculation {
    const hub = AP_TRANSIT_HUBS[req.transitHubId];
    if (!hub) {
      throw new BadRequestException(`Transit hub ${req.transitHubId} is not a recognized AP multimodal hub`);
    }

    const distPickup = calculateDistanceMeters(req.pickupLat, req.pickupLng, hub.latitude, hub.longitude);
    const distDropoff = calculateDistanceMeters(req.dropoffLat, req.dropoffLng, hub.latitude, hub.longitude);
    const minDistanceMeters = Math.min(distPickup, distDropoff);

    // Eligible if within 800m of the transit hub
    const maxThresholdMeters = 800;
    if (minDistanceMeters <= maxThresholdMeters) {
      return {
        eligible: true,
        transitHubId: hub.hubId,
        transitHubName: hub.name,
        distanceToHubMeters: minDistanceMeters,
        discountPaise: 2500, // ₹25.00
        subsidyFundSource: 'AP_URBAN_DECONGESTION_FUND',
        reason: `Trip connects to ${hub.name} within ${minDistanceMeters}m`,
      };
    }

    return {
      eligible: false,
      transitHubId: hub.hubId,
      transitHubName: hub.name,
      distanceToHubMeters: minDistanceMeters,
      discountPaise: 0,
      subsidyFundSource: 'NONE',
      reason: `Origin and destination are outside ${maxThresholdMeters}m feeder perimeter`,
    };
  }

  async claimDiscount(req: FeederDiscountRequest): Promise<FeederDiscountClaim> {
    const calc = this.calculateDiscount(req);
    if (!calc.eligible || calc.discountPaise <= 0) {
      throw new BadRequestException(calc.reason);
    }

    const claimId = `CLAIM-${req.bookingId}-${req.transitHubId}`;
    let existing = await this.claimRepo.findOne({ where: { claimId } });
    if (!existing) {
      existing = this.claimRepo.create({
        claimId,
        bookingId: req.bookingId,
        riderId: req.riderId,
        transitHubId: req.transitHubId,
        discountPaise: calc.discountPaise,
      });
      existing = await this.claimRepo.save(existing);
    }

    return {
      id: existing.id,
      claimId: existing.claimId,
      bookingId: existing.bookingId,
      riderId: existing.riderId,
      transitHubId: existing.transitHubId,
      discountPaise: Number(existing.discountPaise),
      claimedAt: existing.claimedAt ? existing.claimedAt.toISOString() : new Date().toISOString(),
    };
  }
}
