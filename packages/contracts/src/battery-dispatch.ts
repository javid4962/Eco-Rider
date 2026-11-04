/**
 * EcoRide EV Battery-Aware Dispatch Eligibility Contracts (EV-041)
 *
 * Defines the models, policy thresholds, and recovery paths for EV dispatch matching.
 * Validates battery State-of-Charge (SoC), telemetry freshness, range adequacy for
 * pickup + passenger journey + reserve margin + charging contingency, and BEV compliance.
 */

import { ApiErrorCode } from './api-contracts';
import { RangeTelemetrySource, VehicleVerificationStatus } from './vehicles';

/**
 * Configurable thresholds governing EV battery dispatch eligibility.
 * All thresholds can be configured server-side via environment variables or policy overrides.
 */
export interface BatteryDispatchPolicyConfig {
  /** Minimum buffer percentage of battery SoC that must remain post-trip (default: 15.0%) */
  minReserveSocPercent: number;

  /** Minimum safety reserve range in km that must remain post-trip (default: 8.0 km) */
  minReserveRangeKm: number;

  /** Minimum safety contingency distance in km to reach a charging depot or swap hub (default: 5.0 km) */
  contingencyChargerDistanceKm: number;

  /** Maximum allowed age in seconds for live telemetry pings before marked stale (default: 120s) */
  telemetryMaxAgeSeconds: number;

  /** Maximum transit distance in km from captain's current position to pickup (default: 15.0 km) */
  maxPickupDistanceKm: number;
}

/**
 * Default production policy thresholds for EV dispatch matching in Andhra Pradesh.
 */
export const DEFAULT_BATTERY_DISPATCH_POLICY: BatteryDispatchPolicyConfig = {
  minReserveSocPercent: 15.0,
  minReserveRangeKm: 8.0,
  contingencyChargerDistanceKm: 5.0,
  telemetryMaxAgeSeconds: 120,
  maxPickupDistanceKm: 15.0,
};

/**
 * Maximum acceptable telemetry age in seconds based on telemetry ingestion source.
 */
export const TELEMETRY_SOURCE_MAX_AGE_SECONDS: Record<RangeTelemetrySource, number> = {
  [RangeTelemetrySource.OBD_TELEMATICS]: 120, // 2 minutes for direct OBD-II CAN bus
  [RangeTelemetrySource.BMS_IOT_GATEWAY]: 120, // 2 minutes for hardware BMS IoT module
  [RangeTelemetrySource.OEM_CLOUD_API]: 300, // 5 minutes for OEM cloud sync (e.g. Ather, Ola, Tata)
  [RangeTelemetrySource.MANUAL_TELEMETRY]: 600, // 10 minutes for calibrated manual declaration
};

/**
 * Verified EV Charging Depot or Battery Swapping Hub in Andhra Pradesh.
 */
export interface ChargingDepot {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  chargerTypes: ('FAST_DC' | 'BATTERY_SWAP' | 'AC_TYPE_2')[];
  powerKw: number;
  operator: string;
  isActive: boolean;
}

/**
 * Verified Andhra Pradesh Pilot EV Charging and Swapping Hubs.
 */
export const AP_PILOT_CHARGING_DEPOTS: ChargingDepot[] = [
  {
    id: 'ap-depot-rtc-complex',
    name: 'APSRTC Central Fast Charging Hub',
    city: 'visakhapatnam',
    address: 'APSRTC Bus Station Complex, Dwaraka Nagar, Visakhapatnam, AP 530004',
    latitude: 17.7271,
    longitude: 83.3039,
    chargerTypes: ['FAST_DC', 'BATTERY_SWAP', 'AC_TYPE_2'],
    powerKw: 60,
    operator: 'AP E-Mobility Fleet Infrastructure',
    isActive: true,
  },
  {
    id: 'ap-depot-maddilapalem',
    name: 'Maddilapalem EV Swap & Fast Depot',
    city: 'visakhapatnam',
    address: 'Near Maddilapalem Junction, Visakhapatnam, AP 530013',
    latitude: 17.7388,
    longitude: 83.3289,
    chargerTypes: ['BATTERY_SWAP', 'FAST_DC'],
    powerKw: 30,
    operator: 'AP E-Mobility Fleet Infrastructure',
    isActive: true,
  },
  {
    id: 'ap-depot-gajuwaka',
    name: 'Gajuwaka Industrial EV Hub',
    city: 'visakhapatnam',
    address: 'Old Gajuwaka Main Road, Visakhapatnam, AP 530026',
    latitude: 17.6983,
    longitude: 83.2128,
    chargerTypes: ['FAST_DC', 'AC_TYPE_2'],
    powerKw: 60,
    operator: 'AP E-Mobility Fleet Infrastructure',
    isActive: true,
  },
  {
    id: 'ap-depot-rushikonda',
    name: 'Rushikonda IT SEZ Charging Point',
    city: 'visakhapatnam',
    address: 'Hill No. 2, IT SEZ, Rushikonda, Visakhapatnam, AP 530045',
    latitude: 17.7818,
    longitude: 83.3778,
    chargerTypes: ['FAST_DC', 'AC_TYPE_2'],
    powerKw: 30,
    operator: 'AP E-Mobility Fleet Infrastructure',
    isActive: true,
  },
];

/**
 * Standard exclusion reason codes for EV battery dispatch ineligibility.
 */
export type BatteryDispatchExclusionCode =
  | ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT
  | ApiErrorCode.DISPATCH_RANGE_STALE_OR_UNKNOWN
  | ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED;

/**
 * Documented manual recovery path returned to captains when dispatch eligibility fails.
 */
export interface BatteryDispatchRecoveryGuide {
  exclusionType:
    'LOW_BATTERY' | 'STALE_OR_UNKNOWN_RANGE' | 'UNAPPROVED_VEHICLE' | 'EXCESSIVE_DISTANCE';
  title: string;
  summary: string;
  actionSteps: string[];
  nearestChargingDepot?: ChargingDepot | null;
  recalibrationOrSyncEndpoint?: string;
  supportContact: string;
}

/**
 * Detailed breakdown of trip energy and range demands.
 */
export interface TripDistanceBreakdown {
  pickupDistanceKm: number;
  passengerJourneyDistanceKm: number;
  reserveMarginKm: number;
  reserveSocPercent: number;
  contingencyChargerDistanceKm: number;
  nearestDepot: ChargingDepot | null;
  totalRequiredRangeKm: number;
  remainingRangeAfterTripKm: number;
  projectedPostTripSocPercent: number;
}

/**
 * Vehicle attributes evaluated during battery dispatch check.
 */
export interface VehicleBatteryDetails {
  vehicleId: string;
  registrationNumber: string;
  propulsionType: string;
  batteryCapacityKwh: number;
  ratedRangeKm: number;
  currentSocPercent: number;
  practicalRangeKm: number;
  rangeTelemetrySource: RangeTelemetrySource | string;
  telemetryAgeSeconds: number | null;
  isTelemetryFresh: boolean;
  verificationStatus: VehicleVerificationStatus | string;
  isRoadworthy: boolean;
  greenPlateVerified: boolean;
}

/**
 * Request payload to evaluate EV battery dispatch eligibility for a trip.
 */
export interface BatteryDispatchEvaluationRequest {
  captainId?: string;
  vehicleId?: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  tripDistanceKm?: number;
  pickupDistanceKm?: number;
  city?: string;
  policyOverrides?: Partial<BatteryDispatchPolicyConfig>;
}

/**
 * Authoritative response payload detailing EV battery dispatch eligibility.
 */
export interface BatteryDispatchEvaluationResult {
  isEligible: boolean;
  exclusionCode?: BatteryDispatchExclusionCode | null;
  ineligibilityReasons: string[];
  vehicleDetails?: VehicleBatteryDetails | null;
  tripDistanceBreakdown: TripDistanceBreakdown;
  manualRecoveryPath?: BatteryDispatchRecoveryGuide | null;
}

/**
 * Request payload for captain manual or calibrated battery sync (manual recovery path).
 */
export interface CaptainBatterySyncRequest {
  currentSocPercent: number;
  rangeTelemetrySource?: RangeTelemetrySource | string;
  telemetryDeviceId?: string;
  odometerKm?: number;
  notes?: string;
}

/**
 * Response payload following captain battery sync or depot recharge.
 */
export interface CaptainBatterySyncResponse {
  captainId: string;
  vehicleId: string;
  previousSocPercent: number;
  currentSocPercent: number;
  estimatedRangeKm: number;
  syncedAt: string;
  source: string;
  message: string;
}
