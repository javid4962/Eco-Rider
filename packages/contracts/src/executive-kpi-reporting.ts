export interface DailyRegulatoryKpiSummary {
  reportDate: string;
  totalZeroEmissionKm: number;
  totalPassengersMoved: number;
  activeGreenPlateVehicles: number;
  co2AvoidedKg: number;
  totalGstCollectedPaise: {
    passenger5PercentSac996412: number;
    cargo18PercentSac9965: number;
    services18PercentSac9987: number;
    totalPaise: number;
  };
  safetyIncidentRatePerMillionKm: number;
  cryptographicSignature: string;
  generatedAt: string;
}

export interface GenerateDailyKpiReportDto {
  reportDate: string;
  auditorId: string;
}

