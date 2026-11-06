/**
 * M75: Real-Time Driver Fatigue Camera Ingestion & Drowsiness Haptic Warning Telemetry
 * Computer vision telematics from in-cabin Driver Monitoring System (DMS) for EV captains.
 */

export enum FatigueSeverity {
  NORMAL = 'NORMAL',
  MILD_DROWSINESS = 'MILD_DROWSINESS',       // Score 40-69: haptic alert & chime
  SEVERE_FATIGUE = 'SEVERE_FATIGUE',         // Score 70-100: mandatory rest stop lockout
}

export interface DmsCameraTelemetryDto {
  captainId: string;
  vehicleId: string;
  perclosPercent: number; // 0 to 100 (% time eye is closed)
  yawnCountLastMinute: number;
  microSleepDetected: boolean;
  headTiltAngleDegrees: number;
  continuousDrivingMinutes: number;
  timestamp: string;
}

export interface DmsFatigueAssessmentResult {
  captainId: string;
  severity: FatigueSeverity;
  compositeFatigueScore: number; // 0 to 100
  hapticAlertTriggered: boolean;
  mandatoryRestRequired: boolean;
  restDurationMinutes: number;
  dispatchBlockedUntil?: string;
  recommendation: string;
}

