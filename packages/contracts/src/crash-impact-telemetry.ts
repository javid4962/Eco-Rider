export enum CrashSeverity {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CATASTROPHIC = 'CATASTROPHIC',
}

export enum HighVoltageContactorStatus {
  ISOLATED_SAFE = 'ISOLATED_SAFE',
  PYRO_FUSED = 'PYRO_FUSED',
  ISOLATION_FAILED = 'ISOLATION_FAILED',
}

export interface CrashImpactTelemetryEvent {
  id: string;
  vehicleId: string;
  tripId?: string;
  decelerationGForce: number;
  airbagDeployed: boolean;
  pyroFuseBlown: boolean;
  hvContactorStatus: HighVoltageContactorStatus;
  packVoltageVolts: number;
  isolationResistanceKOhms: number;
  latitude: number;
  longitude: number;
  speedKmhAtImpact: number;
  passengerCount: number;
  severity: CrashSeverity;
  emergency112Notified: boolean;
  emergencyDispatchRef?: string;
  createdAt: string;
}

export interface IngestCrashImpactDto {
  vehicleId: string;
  tripId?: string;
  decelerationGForce: number;
  airbagDeployed: boolean;
  pyroFuseBlown: boolean;
  packVoltageVolts: number;
  isolationResistanceKOhms: number;
  latitude: number;
  longitude: number;
  speedKmhAtImpact: number;
  passengerCount: number;
}
