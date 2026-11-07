export enum EcoDrivingTier {
  EXEMPLARY_GREEN = 'EXEMPLARY_GREEN', // Eco-score >= 85
  EFFICIENT_RIDER = 'EFFICIENT_RIDER', // Eco-score 70-84
  STANDARD = 'STANDARD',               // Eco-score < 70
}

export interface IngestEcoTripTelemetryDto {
  captainId: string;
  vehicleId: string;
  totalDistanceKm: number;
  regenEnergyRecoveredKwh: number;
  energyConsumedKwh: number;
  hardBrakingEvents: number;
  rapidAccelerationEvents: number;
}

export interface EcoPerformanceAssessmentResult {
  captainId: string;
  ecoScore: number;
  tier: EcoDrivingTier;
  regenEfficiencyRatio: number;
  monthlyBonusEligible: boolean;
  bonusAmountPaise: number;
  assessedAt: string;
}

