export enum FatigueRiskLevel {
  NORMAL = 'NORMAL',
  MODERATE_ADVISORY = 'MODERATE_ADVISORY', // Approaching continuous threshold (e.g. 4 hrs)
  HIGH_MANDATORY_REST = 'HIGH_MANDATORY_REST', // Exceeded continuous or daily driving limits
}

export interface DriverDutyLogDto {
  id: string;
  captainId: string;
  shiftStartTime: string;
  lastTripEndTime?: string;
  continuousDrivingMinutes: number;
  totalDailyDrivingMinutes: number;
  consecutiveRestMinutes: number;
  fatigueRiskLevel: FatigueRiskLevel;
  isDispatchBlocked: boolean;
  lockoutExpiresAt?: string;
}

export interface IngestDriverFatigueTelemetryDto {
  captainId: string;
  sessionDrivingMinutes: number;
  erraticSteeringEventsCount?: number;
  drowsinessSensorAlert?: boolean;
}

export interface FatigueLockoutStatusDto {
  captainId: string;
  isBlocked: boolean;
  riskLevel: FatigueRiskLevel;
  remainingRestMinutes: number;
  advisoryTelugu: string;
  advisoryEnglish: string;
}

