/**
 * EcoRide EV Vehicle Records, Propulsion Standards & Compliance Contracts (EV-023)
 *
 * Enforces 100% Battery Electric Propulsion, registration standards,
 * approved seating, telemetry sources, insurance, and AP Green-Plate commercial permits.
 */

export enum PropulsionType {
  BATTERY_ELECTRIC = 'BATTERY_ELECTRIC',
}

export const DISALLOWED_PROPULSION_TYPES = [
  'PETROL',
  'DIESEL',
  'HYBRID',
  'PLUGIN_HYBRID',
  'LPG',
  'INTERNAL_COMBUSTION',
] as const;

export type DisallowedPropulsionType = (typeof DISALLOWED_PROPULSION_TYPES)[number];

export enum VehicleCategory {
  CITY_COMMUTE_2W = 'CITY_COMMUTE_2W', // Release A: 2W Electric Bike Taxi (1 passenger, D+1)
  AUTO_COMMUTE_3W = 'AUTO_COMMUTE_3W', // Release B: 3W Electric Auto (3 passengers, D+3)
  CAB_PRIVATE_4W = 'CAB_PRIVATE_4W', // Release C: 4W Electric Sedan/Hatchback (4 passengers, D+4)
  VAN_COMMUTE_4W = 'VAN_COMMUTE_4W', // Release D: 4W Electric Van/Shuttle (5-10 passengers, D+5 to D+10)
}

/**
 * Standardized EV Service Classification mapping to commercial mobility services.
 */
export enum VehicleServiceClass {
  ECO_BIKE = 'ECO_BIKE', // 2W Electric Bike Taxi (D+1, 1 customer seat)
  ECO_AUTO = 'ECO_AUTO', // 3W Electric Auto (D+3, 3 customer seats)
  ECO_CAB = 'ECO_CAB', // 4W Electric Sedan/Hatchback (D+4, 4 customer seats)
  ECO_VAN = 'ECO_VAN', // 4W Electric Van/Shuttle (D+5 to D+10 customer seats)
}

/**
 * Seating Capacity Breakdown strictly accounting for the driver separately.
 * For example, in a "D+3" auto rickshaw:
 * - Driver seat count: 1
 * - Legal passenger capacity (customer seats): 3
 * - Total legal seating capacity: 4 (1 + 3)
 */
export interface SeatingCapacityBreakdown {
  seatingConfiguration: string; // e.g. 'D+1', 'D+3', 'D+4', 'D+7'
  driverSeatCount: number; // strictly 1
  legalPassengerCapacity: number; // customer seats (e.g. 3 for D+3)
  totalSeatingCapacity: number; // driverSeatCount + legalPassengerCapacity (e.g. 4 for D+3)
}

/**
 * Legal passenger seating limits per vehicle category (excluding driver).
 */
export const CATEGORY_SEATING_LIMITS: Record<
  VehicleCategory,
  { minSeats: number; maxSeats: number; defaultSeats: number; defaultNotation: string }
> = {
  [VehicleCategory.CITY_COMMUTE_2W]: {
    minSeats: 1,
    maxSeats: 1,
    defaultSeats: 1,
    defaultNotation: 'D+1',
  },
  [VehicleCategory.AUTO_COMMUTE_3W]: {
    minSeats: 1,
    maxSeats: 3,
    defaultSeats: 3,
    defaultNotation: 'D+3',
  },
  [VehicleCategory.CAB_PRIVATE_4W]: {
    minSeats: 1,
    maxSeats: 4,
    defaultSeats: 4,
    defaultNotation: 'D+4',
  },
  [VehicleCategory.VAN_COMMUTE_4W]: {
    minSeats: 5,
    maxSeats: 10,
    defaultSeats: 7,
    defaultNotation: 'D+7',
  },
};

/**
 * Direct mapping between VehicleCategory and commercial VehicleServiceClass.
 */
export const CATEGORY_TO_SERVICE_CLASS: Record<VehicleCategory, VehicleServiceClass> = {
  [VehicleCategory.CITY_COMMUTE_2W]: VehicleServiceClass.ECO_BIKE,
  [VehicleCategory.AUTO_COMMUTE_3W]: VehicleServiceClass.ECO_AUTO,
  [VehicleCategory.CAB_PRIVATE_4W]: VehicleServiceClass.ECO_CAB,
  [VehicleCategory.VAN_COMMUTE_4W]: VehicleServiceClass.ECO_VAN,
};

/**
 * Reverse mapping from commercial VehicleServiceClass to VehicleCategory.
 */
export const SERVICE_CLASS_TO_CATEGORY: Record<VehicleServiceClass, VehicleCategory> = {
  [VehicleServiceClass.ECO_BIKE]: VehicleCategory.CITY_COMMUTE_2W,
  [VehicleServiceClass.ECO_AUTO]: VehicleCategory.AUTO_COMMUTE_3W,
  [VehicleServiceClass.ECO_CAB]: VehicleCategory.CAB_PRIVATE_4W,
  [VehicleServiceClass.ECO_VAN]: VehicleCategory.VAN_COMMUTE_4W,
};

/**
 * Permitted commercial vehicle categories by Andhra Pradesh municipality.
 * Enforces Rule 2 & 3: Keep uncertain service types and non-pilot cities disabled by default.
 */
export const CITY_PERMITTED_CATEGORIES: Record<string, VehicleCategory[]> = {
  visakhapatnam: [
    VehicleCategory.CITY_COMMUTE_2W,
    VehicleCategory.AUTO_COMMUTE_3W,
    VehicleCategory.CAB_PRIVATE_4W,
  ],
  // Non-pilot cities kept disabled pending municipal EV launch gates
  vijayawada: [],
  guntur: [],
  tirupati: [],
};

export enum RangeTelemetrySource {
  OBD_TELEMATICS = 'OBD_TELEMATICS', // Connected OBD-II / CAN bus dongle
  BMS_IOT_GATEWAY = 'BMS_IOT_GATEWAY', // Direct Battery Management System IoT module
  OEM_CLOUD_API = 'OEM_CLOUD_API', // OEM telemetry API (e.g. Ather, Ola, Tata)
  MANUAL_TELEMETRY = 'MANUAL_TELEMETRY', // Driver-reported telemetry with verification
}

export enum VehicleVerificationStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
}

export interface VehicleDto {
  id: string;
  registrationNumber: string;
  propulsionType: PropulsionType | string;
  vehicleCategory: VehicleCategory | string;
  serviceClass: VehicleServiceClass | string;
  seatingConfiguration: string; // e.g. 'D+1', 'D+3', 'D+4'
  driverSeatCount: number; // strictly 1
  legalPassengerCapacity: number; // customer seats (e.g. 3 for D+3)
  totalSeatingCapacity: number; // driver + passenger (e.g. 4 for D+3)
  make: string;
  model: string;
  yearOfManufacture: number;
  approvedPassengerSeating: number; // retained for backwards compatibility (= legalPassengerCapacity)
  batteryCapacityKwh: number;
  currentSocPercent: number;
  ratedRangeKm: number;
  estimatedRangeKm: number;
  rangeTelemetrySource: RangeTelemetrySource | string;
  telemetryDeviceId?: string | null;
  telemetryLastPingAt?: string | null;
  ownerId?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceExpiryDate?: string | null;
  fitnessCertificateNumber?: string | null;
  fitnessExpiryDate?: string | null;
  commercialPermitNumber?: string | null;
  commercialPermitExpiry?: string | null;
  greenPlateVerified: boolean;
  verificationStatus: VehicleVerificationStatus | string;
  rejectionReason?: string | null;
  isRoadworthy: boolean;
  city: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
  registrationNumber: string;
  propulsionType?: string; // Checked server-side; non-electric explicitly rejected
  vehicleCategory: VehicleCategory | string;
  serviceClass?: VehicleServiceClass | string;
  seatingConfiguration?: string; // e.g. 'D+3' (derives 3 customer seats + 1 driver)
  totalSeatingCapacity?: number; // e.g. 4 (derives 3 customer seats + 1 driver)
  make: string;
  model: string;
  yearOfManufacture: number;
  approvedPassengerSeating?: number;
  batteryCapacityKwh: number;
  currentSocPercent?: number;
  ratedRangeKm: number;
  rangeTelemetrySource?: RangeTelemetrySource | string;
  telemetryDeviceId?: string;
  ownerId?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  fitnessCertificateNumber?: string;
  fitnessExpiryDate?: string;
  commercialPermitNumber?: string;
  commercialPermitExpiry?: string;
  greenPlateVerified?: boolean;
  city?: string;
}

export interface UpdateVehicleRequest {
  vehicleCategory?: VehicleCategory | string;
  serviceClass?: VehicleServiceClass | string;
  seatingConfiguration?: string; // e.g. 'D+3' (derives 3 customer seats + 1 driver)
  totalSeatingCapacity?: number; // e.g. 4 (derives 3 customer seats + 1 driver)
  make?: string;
  model?: string;
  yearOfManufacture?: number;
  approvedPassengerSeating?: number;
  batteryCapacityKwh?: number;
  currentSocPercent?: number;
  ratedRangeKm?: number;
  rangeTelemetrySource?: RangeTelemetrySource | string;
  telemetryDeviceId?: string;
  ownerId?: string;
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: string;
  fitnessCertificateNumber?: string;
  fitnessExpiryDate?: string;
  commercialPermitNumber?: string;
  commercialPermitExpiry?: string;
  greenPlateVerified?: boolean;
  city?: string;
  isActive?: boolean;
  propulsionType?: string; // Attempted tampering to non-electric is strictly rejected
}

export interface ValidateVehicleOperationRequest {
  requestedSeats?: number;
  serviceClass?: VehicleServiceClass | VehicleCategory | string;
  city?: string;
}

export interface VehicleOperationValidationResultDto {
  vehicleId: string;
  canOperate: boolean;
  registrationNumber: string;
  propulsionType: string;
  vehicleCategory: VehicleCategory | string;
  serviceClass: VehicleServiceClass | string;
  seatingConfiguration: string;
  driverSeatCount: number;
  legalPassengerCapacity: number;
  totalSeatingCapacity: number;
  city: string;
  blockers: string[];
}

export interface VehicleTelemetryUpdate {
  currentSocPercent: number;
  rangeTelemetrySource?: RangeTelemetrySource | string;
  estimatedRangeKm?: number;
  telemetryDeviceId?: string;
}

export interface VerifyVehicleRequest {
  status: VehicleVerificationStatus;
  rejectionReason?: string;
  greenPlateVerified?: boolean;
}

export interface VehicleComplianceDto {
  vehicleId: string;
  registrationNumber: string;
  isCompliant: boolean;
  insuranceValid: boolean;
  insuranceDaysRemaining?: number | null;
  fitnessValid: boolean;
  fitnessDaysRemaining?: number | null;
  commercialPermitValid: boolean;
  commercialPermitDaysRemaining?: number | null;
  greenPlateVerified: boolean;
  propulsionValid: boolean;
  issues: string[];
}

export interface VehiclesPaginationQuery {
  page?: number;
  limit?: number;
  category?: VehicleCategory | string;
  city?: string;
  verificationStatus?: VehicleVerificationStatus | string;
  ownerId?: string;
}

export interface PaginatedVehiclesDto {
  items: VehicleDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
