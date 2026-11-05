export interface DepotSolarGenerationDto {
  depotId: string;
  depotName: string;
  currentSolarOutputKw: number;
  gridCarbonIntensityGCo2Kwh: number; // e.g. 720 g/kWh standard vs 50 g/kWh solar
  greenEnergyPercentage: number; // e.g. 85.5%
  updatedAt: string;
}

export interface OptimalChargingDepotRecommendationDto {
  recommendedDepotId: string;
  depotName: string;
  greenEnergyPercentage: number;
  estimatedCo2SavedGrams: number;
  availableChargerGuns: number;
  distanceKm: number;
}

export interface QueryOptimalDepotDto {
  currentLatitude: number;
  currentLongitude: number;
  requiredKwh: number;
}
