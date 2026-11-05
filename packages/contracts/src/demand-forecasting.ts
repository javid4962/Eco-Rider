export interface ZoneDemandForecastDto {
  forecastId: string;
  zoneId: string;
  zoneName: string;
  city: string;
  forecastWindowStart: string;
  forecastWindowEnd: string;
  predictedDemandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_SURGE';
  expectedRidesCount: number;
  currentAvailableCaptains: number;
  deficitOrSurplusCaptains: number; // Negative = Deficit (need more), Positive = Surplus
  recommendedRepositioningIncentivePaise: number;
}

export interface FleetRepositioningOrderDto {
  id: string;
  orderNumber: string;
  captainId: string;
  originZoneName: string;
  destinationZoneName: string;
  incentiveBonusPaise: number;
  formattedBonus: string;
  expiresAt: string;
  status: 'OFFERED' | 'ACCEPTED' | 'COMPLETED' | 'EXPIRED';
}

