export enum GridTariffZone {
  SOLAR_PEAK = 'SOLAR_PEAK',     // 09:00 - 16:00 IST (Lowest cost solar generation)
  NORMAL = 'NORMAL',             // 06:00 - 09:00 & 22:00 - 06:00 IST
  EVENING_PEAK = 'EVENING_PEAK', // 16:00 - 22:00 IST (Highest grid stress & tariff)
}

export interface GridTariffWindowDto {
  zone: GridTariffZone;
  startHourIst: number;
  endHourIst: number;
  ratePerKwhPaise: number;
  formattedRatePerKwh: string;
  discomName: string;
  isGreenEnergyPeak: boolean;
  notes: string;
}

export interface SmartChargeRecommendationDto {
  vehicleId: string;
  vehicleRegistrationNumber: string;
  currentSocPercent: number;
  targetSocPercent: number;
  energyNeededKwh: number;
  recommendedStationId: string;
  recommendedStationName: string;
  recommendedStartWindow: string;
  tariffZone: GridTariffZone;
  estimatedCostPaise: number;
  estimatedSavingsVsPeakPaise: number;
  co2IntensityGramsPerKwh: number;
  isOptimizedForSolar: boolean;
}

