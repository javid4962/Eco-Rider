export type RollbackSeverity = 'NORMAL' | 'MINOR_SLIP' | 'CRITICAL_STALL_WARNING';

export interface InclineTelemetryReading {
  vehicleId: string;
  inclineGradeAngleDegrees: number; // e.g. 8.5 degrees
  flyoverName: string; // e.g. "Kanaka Durga Flyover"
  vehicleSpeedKmph: number;
  motorTorqueNm: number;
  throttlePedalPct: number;
  grossVehicleWeightKg: number;
}

export interface AntiRollbackInterventionResult {
  id: string;
  vehicleId: string;
  flyoverName: string;
  rollbackDetected: boolean;
  severity: RollbackSeverity;
  holdingTorqueBoostNm: number;
  hillStartAssistActive: boolean;
  alertIssued: boolean;
  timestamp: string;
}
