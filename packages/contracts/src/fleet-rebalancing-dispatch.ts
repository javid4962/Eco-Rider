export type MultiDistrictRepositioningStatus = 'OPEN' | 'ACCEPTED' | 'COMPLETED' | 'EXPIRED';

export interface DistrictZoneDemandEstimate {
  zoneId: string;
  district: 'VIJAYAWADA' | 'GUNTUR' | 'AMARAVATHI' | 'MANGALAGIRI';
  currentActiveVehicles: number;
  projectedDemandTrips: number;
  deficitVehicles: number;
}

export interface MultiDistrictRepositioningOrder {
  id: string;
  orderNumber: string;
  sourceDistrict: string;
  targetDistrict: string;
  targetZoneId: string;
  bountyPaise: number; // e.g. 8000 paise (Rs 80)
  captainId?: string;
  vehicleId?: string;
  status: MultiDistrictRepositioningStatus;
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
}
