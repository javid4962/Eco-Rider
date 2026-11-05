export enum RescueServiceType {
  MOBILE_DC_FAST_BOOST = 'MOBILE_DC_FAST_BOOST', // 15-minute emergency top-up
  EV_FLATBED_TOW = 'EV_FLATBED_TOW',             // Transport to depot / fast charger
  ON_SITE_TIRE_ASSISTANCE = 'ON_SITE_TIRE_ASSISTANCE',
}

export enum RescueDispatchStatus {
  REQUESTED = 'REQUESTED',
  DISPATCHED = 'DISPATCHED',
  ARRIVED = 'ARRIVED',
  CHARGING_IN_PROGRESS = 'CHARGING_IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface RescueRequestDto {
  id: string;
  ticketNumber: string;
  vehicleId: string;
  vehicleRegistrationNumber: string;
  captainId: string;
  serviceType: RescueServiceType;
  latitude: number;
  longitude: number;
  landmark: string;
  currentSocPercent: number;
  status: RescueDispatchStatus;
  assignedRescueUnitId?: string;
  estimatedArrivalMinutes?: number;
  feePaise: number;
  gstPaise: number;
  totalAmountPaise: number;
  createdAt: string;
  completedAt?: string;
}

export interface CreateRescueRequestDto {
  vehicleId: string;
  vehicleRegistrationNumber: string;
  captainId: string;
  serviceType: RescueServiceType;
  latitude: number;
  longitude: number;
  landmark: string;
  currentSocPercent: number;
}

export interface RescueUnitDto {
  id: string;
  unitCode: string;
  operatorName: string;
  mobileChargerCapacityKw: number;
  currentBatterySocPercent: number;
  currentLatitude: number;
  currentLongitude: number;
  isAvailable: boolean;
  serviceRadiusKm: number;
}

