export enum GeofenceRuleType {
  MANDATORY_STAGING_BAY = 'MANDATORY_STAGING_BAY',     // EV must stop only in designated bay
  NO_STOPPING_CONGESTION_ZONE = 'NO_STOPPING_CONGESTION_ZONE', // Pickups strictly blocked
  GOVERNMENT_RESTRICTED_ACCESS = 'GOVERNMENT_RESTRICTED_ACCESS', // CUG pass only
}

export interface MunicipalMicroGeofenceDto {
  id: string;
  zoneCode: string;
  name: string;
  city: string;
  authority: string; // e.g. "APCRDA", "VMC"
  ruleType: GeofenceRuleType;
  maxStagingVehicles: number;
  currentStagingVehicles: number;
  boundaryCoordinates: [number, number][]; // [[lat, lng], ...]
  isActive: boolean;
}

export interface StagingBayAllocationDto {
  allocationId: string;
  zoneCode: string;
  vehicleRegistrationNumber: string;
  captainId: string;
  assignedBayNumber: number;
  allocatedAt: string;
  expiresAt: string;
}

export interface CheckStagingAvailabilityDto {
  zoneCode: string;
  vehicleRegistrationNumber: string;
  captainId: string;
}

