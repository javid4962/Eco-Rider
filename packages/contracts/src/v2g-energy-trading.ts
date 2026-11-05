export enum V2gDischargeStatus {
  SCHEDULED = 'SCHEDULED',
  DISCHARGING = 'DISCHARGING',
  COMPLETED = 'COMPLETED',
  ABORTED_SOC_LIMIT = 'ABORTED_SOC_LIMIT',
}

export interface V2gDischargeSessionDto {
  sessionId: string;
  vehicleRegistrationNumber: string;
  depotId: string;
  chargerGunId: string;
  initialSocPercent: number;
  currentSocPercent: number;
  minSocThresholdPercent: number; // minimum reserve, e.g. 40%
  energyExportedKwh: number;
  feedInTariffPaisePerKwh: number; // e.g. 850 paise (₹8.50/kWh)
  totalRevenueEarnedPaise: number;
  status: V2gDischargeStatus;
  startedAt: string;
  completedAt?: string;
}

export interface InitiateV2gDischargeDto {
  vehicleRegistrationNumber: string;
  depotId: string;
  chargerGunId: string;
  currentSocPercent: number;
  minSocThresholdPercent: number;
  targetExportKwh: number;
  feedInTariffPaisePerKwh: number;
}
