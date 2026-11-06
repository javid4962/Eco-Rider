export interface ChargingGunAllocationDto {
  gunId: string;
  vehicleRegistrationNumber: string;
  assignedPowerKw: number;
  priorityScore: number;
  departureScheduledAt: string;
}

export interface DepotLoadStatusDto {
  depotId: string;
  maxTransformerCapacityKw: number;
  currentTotalDrawKw: number;
  utilizationPercentage: number;
  activeVehiclesCount: number;
  allocations: ChargingGunAllocationDto[];
  loadSheddingActive: boolean;
  evaluatedAt: string;
}

export interface BalanceDepotLoadRequestDto {
  depotId: string;
  maxTransformerCapacityKw: number;
  vehicles: Array<{
    gunId: string;
    vehicleRegistrationNumber: string;
    currentSocPercent: number;
    targetSocPercent: number;
    batteryCapacityKwh: number;
    departureScheduledAt: string;
  }>;
}

