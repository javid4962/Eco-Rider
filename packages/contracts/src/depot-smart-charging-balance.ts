export interface VehicleChargeRequirement {
  vehicleId: string;
  currentSocPct: number;
  targetSocPct: number;
  batteryCapacityKwh: number;
  departureDeadline: string; // ISO date string
}

export interface DepotSmartChargingPlanRequest {
  depotId: string;
  totalAvailableAcKw: number;
  vehicles: VehicleChargeRequirement[];
}

export interface VehicleChargingAllocation {
  vehicleId: string;
  allocatedKw: number;
  priorityScore: number;
  estimatedFullChargeAt: string;
}

export interface DepotSmartChargingPlanResult {
  id: string;
  depotId: string;
  totalAllocatedKw: number;
  availableCapacityKw: number;
  unmetDemandKw: number;
  allocations: VehicleChargingAllocation[];
  calculatedAt: string;
}
