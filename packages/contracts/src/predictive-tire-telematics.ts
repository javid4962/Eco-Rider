/**
 * M90: Fleet Predictive Tire Wear & Regenerative Braking Telemetry Optimization
 * EV instantaneous torque stress analysis and predictive maintenance in AP high temperatures.
 */

export enum TireWearStatus {
  HEALTHY = 'HEALTHY',
  MODERATE_WEAR = 'MODERATE_WEAR',
  CRITICAL_REPLACEMENT_REQUIRED = 'CRITICAL_REPLACEMENT_REQUIRED',
}

export interface PredictiveTireTelemetryDto {
  vehicleId: string;
  odometerKm: number;
  tirePressurePsiFrontLeft: number;
  tirePressurePsiFrontRight: number;
  tirePressurePsiRearLeft: number;
  tirePressurePsiRearRight: number;
  treadDepthMmFront: number; // statutory min 1.6mm
  treadDepthMmRear: number;
  rapidAccelerationCount: number;
  regenerativeBrakingHardCount: number;
  ambientRoadTempCelsius: number; // AP summer road temp (up to 48°C)
}

export interface PredictiveTireAssessmentResult {
  vehicleId: string;
  tireWearStatus: TireWearStatus;
  frontTreadRemainingMm: number;
  rearTreadRemainingMm: number;
  estimatedRemainingUsefulLifeKm: number;
  immediateDepotServiceRequired: boolean;
  workOrderCreated: boolean;
  maintenanceWorkOrderRef?: string;
  recommendations: string[];
}

