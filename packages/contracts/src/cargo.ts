/**
 * EcoRide EV Cargo & Hyperlocal Logistics Contracts (EV-113 – EV-120)
 * 100% BEV commercial cargo tiers (2W, 3W, 4W Van), multi-stop routing,
 * loader/helper assistance, Cash-on-Delivery (COD) reconciliation,
 * and geofenced Proof-of-Delivery (POD) OTP verification.
 */

export enum CargoVehicleTier {
  E_CARGO_2W = 'E_CARGO_2W',         // Up to 20kg (Express / documents / food / small parcel)
  E_CARGO_3W = 'E_CARGO_3W',         // Up to 500kg (Electric auto-loader / trade delivery)
  E_CARGO_4W_VAN = 'E_CARGO_4W_VAN', // Up to 1500kg (Commercial electric cargo van)
}

export enum CargoStopType {
  PICKUP = 'PICKUP',
  DROP = 'DROP',
}

export enum CargoShipmentStatus {
  DRAFT = 'DRAFT',
  REQUESTED = 'REQUESTED',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum CodSettlementStatus {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING_COLLECTION = 'PENDING_COLLECTION',
  COLLECTED_BY_CAPTAIN = 'COLLECTED_BY_CAPTAIN',
  SETTLED_TO_MERCHANT = 'SETTLED_TO_MERCHANT',
  REMITTANCE_DISPUTED = 'REMITTANCE_DISPUTED',
}

export interface CargoStopDto {
  id: string;
  sequence: number;
  stopType: CargoStopType;
  address: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
  instructions?: string;
  codPaise: number;
  podOtp?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface CreateCargoStopDto {
  stopType: CargoStopType;
  address: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
  instructions?: string;
  codPaise?: number;
}

export interface CreateCargoShipmentDto {
  senderId?: string;
  tier: CargoVehicleTier;
  packageWeightKg: number;
  packageDescription: string;
  requiresHelper?: boolean;
  stops: CreateCargoStopDto[];
}

export interface CargoShipmentDto {
  id: string;
  trackingNumber: string;
  senderId: string;
  assignedCaptainId?: string;
  assignedVehicleId?: string;
  tier: CargoVehicleTier;
  status: CargoShipmentStatus;
  packageWeightKg: number;
  packageDescription: string;
  requiresHelper: boolean;
  baseFarePaise: number;
  weightFarePaise: number;
  distanceFarePaise: number;
  stopsFarePaise: number;
  helperFarePaise: number;
  gstPaise: number;
  totalFarePaise: number;
  formattedTotalFare: string;
  totalCodPaise: number;
  stops: CargoStopDto[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliverCargoStopDto {
  podOtp: string;
  recipientName: string;
  signatureHash?: string;
  captainLatitude: number;
  captainLongitude: number;
  cashCollectedPaise?: number;
}

export interface SettleCodDto {
  shipmentId: string;
  stopId: string;
  merchantAccountId: string;
  referenceId: string;
}

export interface CargoPricingCalculation {
  tier: CargoVehicleTier;
  packageWeightKg: number;
  estimatedDistanceKm: number;
  stopsCount: number;
  requiresHelper: boolean;
  baseFarePaise: number;
  weightFarePaise: number;
  distanceFarePaise: number;
  stopsFarePaise: number;
  helperFarePaise: number;
  subtotalFarePaise: number;
  gstPaise: number;
  totalFarePaise: number;
}

