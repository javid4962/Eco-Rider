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
  CITY_COMMUTE_2W = 'CITY_COMMUTE_2W', // Release A: 2W Electric Bike Taxi (1 passenger)
  AUTO_COMMUTE_3W = 'AUTO_COMMUTE_3W', // Release B: 3W Electric Auto (3 passengers)
  CAB_PRIVATE_4W = 'CAB_PRIVATE_4W', // Release C: 4W Electric Sedan/Hatchback (4 passengers)
  VAN_COMMUTE_4W = 'VAN_COMMUTE_4W', // Release D: 4W Electric Van/Shuttle (6-7 passengers)
}

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
  make: string;
  model: string;
  yearOfManufacture: number;
  approvedPassengerSeating: number;
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
  make: string;
  model: string;
  yearOfManufacture: number;
  approvedPassengerSeating: number;
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
