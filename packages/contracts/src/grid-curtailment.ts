export enum GridFrequencyStatus {
  NORMAL = 'NORMAL',
  WARNING_LOW = 'WARNING_LOW',
  CRITICAL_UNDER_FREQUENCY = 'CRITICAL_UNDER_FREQUENCY',
}

export enum CurtailmentLevel {
  NONE = 'NONE',
  THROTTLE_50_PERCENT = 'THROTTLE_50_PERCENT',
  SHUTDOWN_NON_ESSENTIAL = 'SHUTDOWN_NON_ESSENTIAL',
}

export interface GridFrequencyReadingDto {
  gridFrequencyHz: number;
  substationId: string;
  gridOperator: 'APSLDC' | 'APCPDCL';
  timestamp: string;
}

export interface CurtailmentInstructionResult {
  readingId: string;
  gridFrequencyHz: number;
  status: GridFrequencyStatus;
  curtailmentLevel: CurtailmentLevel;
  totalCurtailedKw: number;
  ancillaryCreditPaisePerHour: number;
  affectedGunCount: number;
  curtailedAt: string;
}
