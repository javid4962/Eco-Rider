export enum GridTariffPeriod {
  OFF_PEAK = 'OFF_PEAK',
  STANDARD = 'STANDARD',
  PEAK_SURGE = 'PEAK_SURGE',
  SOLAR_SUPER_OFF_PEAK = 'SOLAR_SUPER_OFF_PEAK',
}

export enum DiscomProvider {
  APSPDCL = 'APSPDCL', // Southern Power Distribution Company of AP
  APEPDCL = 'APEPDCL', // Eastern Power Distribution Company of AP
}

export interface EvaluateGridPeakTariffDto {
  depotId: string;
  discom: DiscomProvider;
  currentHourOfDay: number; // 0-23
  activeChargerDrawKw: number;
  baseTariffPaisePerKwh: number;
}

export interface GridPeakTariffEvaluation {
  tariffPeriod: GridTariffPeriod;
  effectiveRatePaisePerKwh: number;
  peakSurchargePaisePerKwh: number;
  corridorSurgeMultiplier: number;
  isPeakSurgeActive: boolean;
  throttleAdvisory: string;
}
