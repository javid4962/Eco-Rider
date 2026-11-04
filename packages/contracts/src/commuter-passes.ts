/**
 * EcoRide Personal Monthly Commuter Passes & SLA Guarantees Contracts (EV-098 – EV-109)
 * Multi-ride bundles, advance escrow trust, idempotent redemptions,
 * and automated delay compensation ledger postings.
 */

export enum CommuterPassType {
  MONTHLY_UNLIMITED = 'MONTHLY_UNLIMITED',
  FLEXI_10_RIDE = 'FLEXI_10_RIDE',
  STUDENT_PASS = 'STUDENT_PASS',
  CORRIDOR_COMMUTE = 'CORRIDOR_COMMUTE',
}

export enum CommuterPassStatus {
  ACTIVE = 'ACTIVE',
  EXHAUSTED = 'EXHAUSTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface PassPlanDto {
  id: string;
  code: string; // e.g. 'PASS-AP-VJA-GNT-30D'
  name: string;
  city: string;
  passType: CommuterPassType;
  pricePaise: number;
  formattedPrice: string;
  validityDays: number;
  rideLimit: number; // e.g. 60 or 10
  isActive: boolean;
}

export interface CreatePassPlanDto {
  code: string;
  name: string;
  city: string;
  passType: CommuterPassType;
  pricePaise: number;
  validityDays: number;
  rideLimit: number;
}

export interface PurchasePassDto {
  planId: string;
  riderId?: string;
  idempotencyKey?: string;
}

export interface CommuterPassDto {
  id: string;
  passNumber: string;
  riderId: string;
  planId: string;
  planName: string;
  passType: CommuterPassType;
  status: CommuterPassStatus;
  validFrom: string;
  validUntil: string;
  totalRidesAllocated: number;
  ridesRemaining: number;
  purchasedPricePaise: number;
  formattedPrice: string;
  createdAt: string;
}

export interface RedeemPassDto {
  passId: string;
  bookingId?: string;
  tripId?: string;
  idempotencyKey?: string;
}

export interface RedeemPassResponse {
  redemptionId: string;
  passId: string;
  ridesRemaining: number;
  status: CommuterPassStatus;
  redeemedAt: string;
}

export interface SlaDelayCompensationDto {
  tripId: string;
  delayMinutes: number;
  compensationPaise: number;
  reason: string;
}

export interface SlaCompensationResponse {
  tripId: string;
  delayMinutes: number;
  compensatedPassengersCount: number;
  totalCompensationPaise: number;
  formattedTotal: string;
  processedAt: string;
}

