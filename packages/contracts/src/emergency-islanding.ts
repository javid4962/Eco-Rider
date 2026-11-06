export enum IslandingMissionStatus {
  STANDBY = 'STANDBY',
  DISPATCHED = 'DISPATCHED',
  SUPPLYING_POWER = 'SUPPLYING_POWER',
  MISSION_COMPLETED = 'MISSION_COMPLETED',
}

export interface EmergencyPowerMissionDto {
  missionId: string;
  targetFacilityName: string; // e.g. "Guntur Government General Hospital (GGH)"
  facilityType: 'HOSPITAL' | 'WATER_PUMPING' | 'CYCLONE_SHELTER';
  assignedFleetVehicleNumber: string;
  inverterCapacityKw: number; // e.g. 60 kW
  batteryReserveKwh: number; // e.g. 70 kWh
  durationHoursEstimated: number;
  status: IslandingMissionStatus;
  dispatchedAt: string;
}

export interface DispatchEmergencyPowerDto {
  targetFacilityName: string;
  facilityType: 'HOSPITAL' | 'WATER_PUMPING' | 'CYCLONE_SHELTER';
  assignedFleetVehicleNumber: string;
  inverterCapacityKw: number;
  batteryReserveKwh: number;
}

