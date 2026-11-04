/**
 * EcoRide Captain Availability & Location Freshness Contracts (EV-040)
 *
 * Models the 6 availability lifecycle states (OFFLINE, AVAILABLE, RESERVED, ON_TRIP, CHARGING, MAINTENANCE),
 * high-frequency authenticated location updates, accuracy verification, and 30-second telemetry expiry.
 */

import { DutyStatus } from './compliance';

/**
 * Six authoritative operational and availability states for EV captains.
 */
export enum CaptainAvailabilityStatus {
  OFFLINE = 'OFFLINE',
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  ON_TRIP = 'ON_TRIP',
  CHARGING = 'CHARGING',
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * Telemetry freshness threshold: Location pings older than 30s are marked stale.
 */
export const LOCATION_FRESHNESS_TTL_SECONDS = 30;

/**
 * Maximum acceptable horizontal GPS accuracy in meters.
 * Pings with accuracy > 50m are flagged as degraded/inaccurate.
 */
export const MAX_LOCATION_ACCURACY_METERS = 50.0;

/**
 * Minimum vehicle battery State of Charge required for dispatch eligibility.
 */
export const MIN_BATTERY_SOC_PERCENT = 20.0;

/**
 * Request payload for authenticated captain location ingestion.
 */
export interface CaptainLocationPingRequest {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  headingDegrees?: number;
  speedKmph?: number;
  altitudeMeters?: number;
  batterySocPercent?: number;
  recordedAt?: string;
}

/**
 * Normalized captain location telemetry DTO.
 */
export interface CaptainLocationDto {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  headingDegrees: number | null;
  speedKmph: number | null;
  altitudeMeters: number | null;
  batterySocPercent: number | null;
  updatedAt: string;
  isFresh: boolean;
  ageSeconds: number;
}

/**
 * Request payload to transition captain availability status.
 */
export interface UpdateAvailabilityRequest {
  status: CaptainAvailabilityStatus;
  reason?: string;
  batterySocPercent?: number;
}

/**
 * Response payload detailing captain availability, location, and dispatch eligibility.
 */
export interface CaptainAvailabilityResponse {
  captainId: string;
  userId: string;
  availabilityStatus: CaptainAvailabilityStatus;
  dutyStatus: DutyStatus | string;
  location: CaptainLocationDto | null;
  isEligibleForDispatch: boolean;
  ineligibilityReasons: string[];
  lastStatusChangedAt: string;
}

/**
 * Dispatch eligibility audit breakdown response.
 */
export interface DispatchEligibilityResponse {
  captainId: string;
  userId: string;
  availabilityStatus: CaptainAvailabilityStatus;
  isEligibleForDispatch: boolean;
  isLocationFresh: boolean;
  locationAgeSeconds: number | null;
  isAccuracyAcceptable: boolean;
  accuracyMeters: number | null;
  batterySocPercent: number | null;
  isBatterySufficient: boolean;
  ineligibilityReasons: string[];
}

/**
 * Proximity query request to find available, location-fresh captains for dispatch.
 */
export interface QueryAvailableCaptainsRequest {
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  serviceCategory?: string;
}

/**
 * Summary DTO of an available dispatch-eligible captain within spatial proximity.
 */
export interface AvailableCaptainSummaryDto {
  captainId: string;
  userId: string;
  name: string;
  vehicleId?: string | null;
  registrationNumber?: string | null;
  vehicleCategory?: string | null;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  batterySocPercent: number | null;
  locationAgeSeconds: number;
  distanceMeters?: number | null;
}
