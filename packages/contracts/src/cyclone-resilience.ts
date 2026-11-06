/**
 * M80: Disaster Resilience Cyclone Preparedness Automated Fleet Safe-Staging Relocation
 * Emergency response protocols for coastal Andhra cyclones & Krishna River flooding.
 */

export enum CycloneSeverityAlert {
  YELLOW_WATCH = 'YELLOW_WATCH',
  ORANGE_WARNING = 'ORANGE_WARNING',
  RED_EMERGENCY = 'RED_EMERGENCY',
}

export enum FleetRelocationStatus {
  PLAN_GENERATED = 'PLAN_GENERATED',
  RELOCATION_DISPATCHED = 'RELOCATION_DISPATCHED',
  IN_TRANSIT = 'IN_TRANSIT',
  SAFE_STAGED = 'SAFE_STAGED',
  ALL_CLEAR = 'ALL_CLEAR',
}

export interface CycloneAlertFeedDto {
  alertLevel: CycloneSeverityAlert;
  cycloneName: string; // e.g. Cyclone Michaung, Vardah
  projectedWindSpeedKmph: number;
  expectedRainfallMm: number;
  surgeFloodRiskZones: string[]; // e.g. ['BHAVANIPURAM_LOWLANDS', 'KRISHNA_RIVER_KARAKATTA']
  safeElevatedStagingHubs: string[]; // e.g. ['MANGALAGIRI_AIIMS_HIGH_GROUND', 'VELAGAPUDI_ELEVATED_DEPOT']
  effectiveUntil: string;
}

export interface TriggerFleetRelocationDto {
  cycloneAlertId: string;
  sourceFloodZone: string;
  targetSafeStagingHub: string;
  vehicleIds: string[];
}

export interface FleetRelocationPlanResult {
  planId: string;
  alertLevel: CycloneSeverityAlert;
  totalVehiclesTargeted: number;
  successfullyStagedCount: number;
  relocationStatus: FleetRelocationStatus;
  elevationDeltaMeters: number;
  evacuationTimestamp: string;
  instructions: string;
}

