export enum PreFlightScreeningStatus {
  PASSED = 'PASSED',
  FAILED_ALCOHOL = 'FAILED_ALCOHOL',
  FAILED_VITALS = 'FAILED_VITALS',
  EXEMPTED = 'EXEMPTED',
}

export interface CaptainWellnessScreeningDto {
  screeningId: string;
  captainId: string;
  depotId: string;
  bloodAlcoholContentMgDl: number; // 0.0 mg/dL strictly required
  pulseOximeterSpO2Percent: number; // >= 95%
  heartRateBpm: number; // 50 to 110 bpm
  bodyTemperatureCelsius: number; // 36.0 to 37.8 C
  status: PreFlightScreeningStatus;
  fitForDuty: boolean;
  screenedAt: string;
}

export interface RecordWellnessCheckDto {
  captainId: string;
  depotId: string;
  bloodAlcoholContentMgDl: number;
  pulseOximeterSpO2Percent: number;
  heartRateBpm: number;
  bodyTemperatureCelsius: number;
}
