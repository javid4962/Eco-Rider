export enum AqiLevel {
  GOOD = 'GOOD',             // 0-50
  SATISFACTORY = 'SATISFACTORY', // 51-100
  MODERATE = 'MODERATE',     // 101-200
  POOR = 'POOR',             // 201-300
  VERY_POOR = 'VERY_POOR',   // 301-400
  SEVERE = 'SEVERE',         // 401-500
}

export interface IngestAqiTelemetryDto {
  sensorLocation: string;
  stationCode: string;
  aqiValue: number;
  pm25: number;
  pm10: number;
  recordedAt: string;
}

export interface AqiSubsidyEvaluationResult {
  stationCode: string;
  aqiValue: number;
  aqiLevel: AqiLevel;
  isCleanAirSubsidyActive: boolean;
  subsidyDiscountPercent: number;
  maxSubsidyPaise: number;
  municipalSponsor: string;
}

export interface ApplyCleanAirSubsidyDto {
  quoteId: string;
  baseFarePaise: number;
  stationCode: string;
}

export interface CleanAirFareDiscountResult {
  quoteId: string;
  originalFarePaise: number;
  discountPaise: number;
  payableFarePaise: number;
  municipalGrantCoveredPaise: number;
  aqiLevel: AqiLevel;
}
