export type FeederTransitHubType = 'RAILWAY_STATION' | 'BUS_TERMINAL' | 'METRO_STATION';

export interface TransitHubLocation {
  hubId: string;
  name: string;
  type: FeederTransitHubType;
  latitude: number;
  longitude: number;
  city: 'VIJAYAWADA' | 'GUNTUR' | 'AMARAVATHI' | 'MANGALAGIRI';
}

export interface FeederDiscountRequest {
  riderId: string;
  bookingId: string;
  transitHubId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  transitTicketNumber?: string;
}

export interface FeederDiscountCalculation {
  eligible: boolean;
  transitHubId: string;
  transitHubName: string;
  distanceToHubMeters: number;
  discountPaise: number;
  subsidyFundSource: string;
  reason: string;
}

export interface FeederDiscountClaim {
  id: string;
  claimId: string;
  bookingId: string;
  riderId: string;
  transitHubId: string;
  discountPaise: number;
  claimedAt: string;
}
