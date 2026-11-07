export enum FloodEvacuationRiskSeverity {
  NORMAL = 'NORMAL',
  WATERLOGGED_PASSABLE = 'WATERLOGGED_PASSABLE',
  INUNDATED_CRITICAL = 'INUNDATED_CRITICAL',
  EVACUATION_MANDATORY = 'EVACUATION_MANDATORY',
}

export interface FloodEvacuationAlert {
  id: string;
  sensorLocation: string;
  canalOrWaterBody: string;
  zone: string;
  waterDepthMm: number;
  criticalThresholdMm: number;
  flowVelocityMps: number;
  severity: FloodEvacuationRiskSeverity;
  rerouteActiveTrips: boolean;
  evacuationHubName?: string;
  evacuationHubLat?: number;
  evacuationHubLng?: number;
  activeVehiclesNotifiedCount: number;
  createdAt: string;
}

export interface IngestFloodSensorDto {
  sensorLocation: string;
  canalOrWaterBody: string;
  zone: string;
  waterDepthMm: number;
  flowVelocityMps: number;
}
