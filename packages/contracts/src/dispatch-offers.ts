/**
 * EcoRide Expiring Dispatch Offers & Redispatch Contracts (EV-043)
 * Authoritative schemas for timed dispatch offers, accept/decline/timeout transitions,
 * reliable queue job tracking, and next-captain redispatch governance.
 */

export enum DispatchOfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  TIMED_OUT = 'TIMED_OUT',
  SUPERSEDED = 'SUPERSEDED',
  CANCELLED = 'CANCELLED',
}

export enum DispatchOfferDeclineReason {
  TOO_FAR = 'TOO_FAR',
  LOW_BATTERY = 'LOW_BATTERY',
  PERSONAL_BREAK = 'PERSONAL_BREAK',
  UNSUITABLE_ROUTE = 'UNSUITABLE_ROUTE',
  DECLINED_BY_CAPTAIN = 'DECLINED_BY_CAPTAIN',
  OTHER = 'OTHER',
}

/**
 * Authoritative dispatch offer DTO representing a timed offer sent to an eligible captain.
 */
export interface DispatchOfferDto {
  id: string;
  bookingId: string;
  captainId: string;
  vehicleId: string;
  offerSequence: number;
  status: DispatchOfferStatus | string;
  offeredAt: string; // ISO-8601 UTC
  expiresAt: string; // ISO-8601 UTC
  respondedAt: string | null; // ISO-8601 UTC
  declineReason: string | null;
  timeoutJobId: string | null;
  offerTimeoutSeconds: number;
  estimatedPickupDistanceMeters: number;
  estimatedPickupDurationSeconds: number;
  metadata: Record<string, unknown>;
  createdAt: string; // ISO-8601 UTC
  updatedAt: string; // ISO-8601 UTC
}

/**
 * Request payload to initiate or retry dispatch for a ride booking.
 */
export interface CreateDispatchOfferRequest {
  bookingId: string;
  offerTimeoutSeconds?: number;
  rankingStrategy?: string;
}

/**
 * Request payload when a captain claims / accepts a timed dispatch offer.
 */
export interface AcceptDispatchOfferRequest {
  idempotencyKey?: string;
  notes?: string;
}

/**
 * Request payload when a captain explicitly declines a timed dispatch offer.
 */
export interface DeclineDispatchOfferRequest {
  reason?: DispatchOfferDeclineReason | string;
  notes?: string;
}

/**
 * Request payload when a timeout is triggered by queue worker or background sweeper.
 */
export interface TimeoutDispatchOfferRequest {
  triggeredBy?: 'QUEUE_WORKER' | 'ADMIN' | 'SWEEPER' | string;
  reason?: string;
}

/**
 * Response payload upon successful dispatch offer acceptance.
 */
export interface AcceptDispatchOfferResponse {
  offer: DispatchOfferDto;
  bookingId: string;
  bookingStatus: string;
  assignedCaptainId: string;
  assignedVehicleId: string;
  assignedAt: string; // ISO-8601 UTC
  assignedOutboxEventId?: string;
}

/**
 * Response payload upon offer decline, including redispatch status.
 */
export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export interface DispatchOutboxEventDto {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: OutboxEventStatus | string;
  retryCount: number;
  errorMessage?: string | null;
  createdAt: string; // ISO-8601 UTC
  processedAt?: string | null; // ISO-8601 UTC
}

export interface DeclineDispatchOfferResponse {
  offer: DispatchOfferDto;
  redispatched: boolean;
  nextOfferId?: string | null;
  nextCaptainId?: string | null;
  bookingStatus: string;
}

/**
 * Response payload upon offer timeout, including redispatch status.
 */
export interface TimeoutDispatchOfferResponse {
  offer: DispatchOfferDto;
  redispatched: boolean;
  nextOfferId?: string | null;
  nextCaptainId?: string | null;
  bookingStatus: string;
}

/**
 * Chronological summary of all dispatch offers generated for a booking.
 */
export interface DispatchOffersSummaryResponse {
  bookingId: string;
  bookingStatus: string;
  activeOffer: DispatchOfferDto | null;
  totalOffersCount: number;
  offers: DispatchOfferDto[];
}
