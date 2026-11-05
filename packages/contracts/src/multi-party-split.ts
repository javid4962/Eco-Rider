export enum SplitDisbursalStatus {
  SPLIT_PENDING = 'SPLIT_PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export interface SplitPayoutItemDto {
  recipientId: string;
  recipientRole: 'CAPTAIN' | 'FLEET_OWNER' | 'PLATFORM';
  payoutMethod: 'UPI' | 'IMPS' | 'WALLET';
  payoutVpaOrAccount: string;
  amountPaise: number;
  utrReference?: string;
  status: SplitDisbursalStatus;
}

export interface SplitPayoutBatchDto {
  id: string;
  bookingId: string;
  totalGrossFarePaise: number;
  captainSharePaise: number;
  fleetOwnerSharePaise: number;
  platformFeePaise: number;
  gstPaise: number;
  disbursedItems: SplitPayoutItemDto[];
  processedAt: string;
}

export interface ExecuteSplitPayoutDto {
  bookingId: string;
  grossFarePaise: number;
  captainId: string;
  captainVpa: string;
  fleetOwnerId?: string;
  fleetOwnerVpa?: string;
  ownerSharePercent?: number; // e.g. 30% to owner, 50% to captain, 20% platform
}

