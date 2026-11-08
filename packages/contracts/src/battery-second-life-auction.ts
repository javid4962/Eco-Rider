export enum SecondLifeGrade {
  TIER_1_STATIONARY_STORAGE = 'TIER_1_STATIONARY_STORAGE', // SoH 65-75%
  TIER_2_LOW_DEMAND_BACKUP = 'TIER_2_LOW_DEMAND_BACKUP',     // SoH 50-65%
  RECYCLING_ONLY = 'RECYCLING_ONLY',                         // SoH < 50%
}

export enum SecondLifeAuctionStatus {
  LISTED = 'LISTED',
  ASSIGNED_TO_BESS = 'ASSIGNED_TO_BESS',
  RECYCLED = 'RECYCLED',
}

export interface ValueBatterySecondLifeDto {
  packSerial: string;
  originalCapacityKwh: number;
  currentSohPercent: number;
  cycleCount: number;
  depotLocation: string;
}

export interface BatterySecondLifeValuationResult {
  listingId: string;
  packSerial: string;
  grade: SecondLifeGrade;
  status: SecondLifeAuctionStatus;
  remainingCapacityKwh: number;
  estimatedSalvageValuationPaise: number;
  recommendedStationaryBessDepot: string;
  evaluatedAt: Date;
}
