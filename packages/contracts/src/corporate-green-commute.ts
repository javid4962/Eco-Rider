export enum GreenBadgeTier {
  BRONZE_COMMUTER = 'BRONZE_COMMUTER',
  SILVER_ECO_RIDER = 'SILVER_ECO_RIDER',
  GOLD_CARBON_SAVER = 'GOLD_CARBON_SAVER',
  PLATINUM_NET_ZERO_HERO = 'PLATINUM_NET_ZERO_HERO',
}

export interface RecordGreenTripDto {
  corporateAccountId: string;
  employeeId: string;
  distanceKm: number;
  cleanEnergyKwhUsed: number;
}

export interface GreenCommuteProfileResult {
  employeeId: string;
  corporateAccountId: string;
  totalElectricKm: number;
  totalKgCo2Saved: number;
  currentTier: GreenBadgeTier;
  greenPoints: number;
  unlockedBadges: string[];
  updatedAt: string;
}

export interface CorporateOffsetPurchaseDto {
  corporateAccountId: string;
  metricTonsCo2ToOffset: number;
  offsetCostPaisePerTon: number;
}

export interface CorporateOffsetReceipt {
  purchaseId: string;
  corporateAccountId: string;
  metricTonsCo2Offset: number;
  totalPaidPaise: number;
  certificateRef: string;
  issuedAt: string;
}

