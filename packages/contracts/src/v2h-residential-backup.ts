export enum V2hDischargeStatus {
  STANDBY_READY = 'STANDBY_READY',
  DISCHARGING = 'DISCHARGING',
  TARGET_REACHED = 'TARGET_REACHED',
  EMERGENCY_RESERVE_TRIP = 'EMERGENCY_RESERVE_TRIP',
}

export interface InitiateV2hDischargeDto {
  householdAccountId: string;
  vehicleId: string;
  contractedKwh: number;
  criticalLoadType: 'MEDICAL_OXYGEN_CONCENTRATOR' | 'EMERGENCY_LIGHTING' | 'REFRIGERATION';
}

export interface V2hDischargeTelemetryDto {
  sessionId: string;
  energyDeliveredKwh: number;
  batteryRemainingSoc: number;
}

export interface V2hSessionResult {
  sessionId: string;
  householdAccountId: string;
  vehicleId: string;
  energyDeliveredKwh: number;
  dischargeTariffPaisePerKwh: number;
  totalEarningsPaise: number;
  status: V2hDischargeStatus;
  startedAt: string;
  endedAt: string | null;
}
