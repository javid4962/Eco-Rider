/**
 * M79: Autonomous Low-Battery Stranded Vehicle Mobile Power Bank (Vehicle-to-Vehicle V2V) Rescue
 * Mobile fast-charging roadside assistance for critically depleted EVs in Andhra Pradesh.
 */

export enum V2vRescueStatus {
  REQUESTED = 'REQUESTED',
  DISPATCHED = 'DISPATCHED',
  CHARGING_IN_PROGRESS = 'CHARGING_IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface RequestV2vRescueDto {
  strandedVehicleId: string;
  captainId: string;
  latitude: number;
  longitude: number;
  currentSocPercent: number; // e.g. 3% (< 5% is critical)
  batteryCapacityKwh: number;
  targetKwhRequired: number; // e.g. 10 kWh to reach nearest depot/hub
  highwayOrCorridorName?: string; // e.g. 'NH-16 Kaza Tollway'
}

export interface V2vRescueMissionResult {
  missionId: string;
  rescueVehicleId: string;
  rescueCaptainId: string;
  strandedVehicleId: string;
  status: V2vRescueStatus;
  etaMinutes: number;
  transferredKwh: number;
  baseDispatchFeePaise: number; // 35000 paise (₹350.00)
  energyFeePaise: number; // ₹12/kWh (1200 paise/kWh)
  gstPaise: number; // 18% SAC 9987 for roadside charging
  totalRescueCostPaise: number;
  totalCostPaise: number;
}
