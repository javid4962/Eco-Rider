export enum LostItemCategory {
  ELECTRONICS = 'ELECTRONICS',
  WALLET_CURRENCY = 'WALLET_CURRENCY',
  OFFICIAL_DOCUMENTS = 'OFFICIAL_DOCUMENTS',
  BAGS_LUGGAGE = 'BAGS_LUGGAGE',
  OTHER = 'OTHER',
}

export enum CustodyStatus {
  LOGGED_BY_CAPTAIN = 'LOGGED_BY_CAPTAIN',
  SECURED_IN_DEPOT_VAULT = 'SECURED_IN_DEPOT_VAULT',
  CLAIM_VERIFIED = 'CLAIM_VERIFIED',
  RETURNED_TO_OWNER = 'RETURNED_TO_OWNER',
}

export interface LostItemCustodyDto {
  trackingBarcode: string;
  tripId: string;
  captainId: string;
  depotId?: string;
  vaultLockerNumber?: string;
  itemCategory: LostItemCategory;
  description: string;
  status: CustodyStatus;
  claimVerificationOtpHash?: string;
  loggedAt: string;
  returnedAt?: string;
}

export interface LogFoundItemDto {
  tripId: string;
  captainId: string;
  itemCategory: LostItemCategory;
  description: string;
}

export interface SecureInVaultDto {
  trackingBarcode: string;
  depotId: string;
  vaultLockerNumber: string;
}

export interface ClaimItemDto {
  trackingBarcode: string;
  riderId: string;
  claimOtp: string;
}

