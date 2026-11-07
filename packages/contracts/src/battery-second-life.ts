export enum BatteryHealthGrade {
  GRADE_A_AUTOMOTIVE = 'GRADE_A_AUTOMOTIVE',
  GRADE_B_SECOND_LIFE = 'GRADE_B_SECOND_LIFE',
  GRADE_C_RECYCLE = 'GRADE_C_RECYCLE',
}

export enum SecondLifeDutyRating {
  DEPOT_STATIONARY_STORAGE = 'DEPOT_STATIONARY_STORAGE',
  SOLAR_MICROGRID_BUFFER = 'SOLAR_MICROGRID_BUFFER',
  EMERGENCY_RESCUE_PACK = 'EMERGENCY_RESCUE_PACK',
  REJECTED = 'REJECTED',
}

export interface EvaluateSecondLifeDto {
  batterySerial: string;
  originalVehicleId: string;
  originalCapacityKwh: number;
  measuredCapacityKwh: number;
  internalResistanceMilliohm: number;
  nominalResistanceMilliohm: number;
  cycleCount: number;
  cellDegradationSpreadMv: number;
}

export interface BatterySecondLifeAssessmentResult {
  batterySerial: string;
  originalVehicleId: string;
  stateOfHealthPercent: number;
  resistanceRatio: number;
  healthGrade: BatteryHealthGrade;
  assignedDuty: SecondLifeDutyRating;
  isEligibleForSecondLife: boolean;
  recommendedMaxCrate: number;
  estimatedRemainingCycles: number;
  assessedAt: string;
}
