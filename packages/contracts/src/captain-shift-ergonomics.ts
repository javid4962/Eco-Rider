export enum ShiftDutyStatus {
  ACTIVE_ON_DUTY = 'ACTIVE_ON_DUTY',
  MANDATORY_REST_REQUIRED = 'MANDATORY_REST_REQUIRED',
  SHIFT_LIMIT_REACHED = 'SHIFT_LIMIT_REACHED',
  OFF_DUTY_RESTING = 'OFF_DUTY_RESTING',
}

export interface RecordDutyHoursDto {
  captainId: string;
  continuousDrivingMinutes: number;
  totalShiftMinutes: number;
}

export interface ShiftErgonomicsResult {
  captainId: string;
  continuousDrivingMinutes: number;
  totalShiftMinutes: number;
  dutyStatus: ShiftDutyStatus;
  isDispatchEligible: boolean;
  requiredRestMinutesRemaining: number;
  cooldownExpiry: string | null;
  message: string;
}

export interface LogRestBreakDto {
  captainId: string;
  restHubId: string;
  breakDurationMinutes: number;
}
