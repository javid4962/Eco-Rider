export enum SubLeaseStatus {
  ACTIVE = 'ACTIVE',
  DELINQUENT = 'DELINQUENT',
  TERMINATED = 'TERMINATED',
  PENDING_BOND = 'PENDING_BOND',
}

export enum EscrowSplitType {
  TRIPARTITE_REVENUE_SHARE = 'TRIPARTITE_REVENUE_SHARE',
  FIXED_DAILY_RENTAL = 'FIXED_DAILY_RENTAL',
}

export interface ProcessSubLeaseSettlementDto {
  contractId: string;
  vehicleId: string;
  captainId: string;
  fleetOwnerId: string;
  batteryAssetCoId: string;
  grossFarePaise: number;
  platformFeePaise: number;
}

export interface SubLeaseSettlementResult {
  settlementId: string;
  contractId: string;
  grossFarePaise: number;
  platformFeePaise: number;
  netDistributablePaise: number;
  captainSharePaise: number;       // e.g. 50%
  fleetOwnerSharePaise: number;    // e.g. 30%
  batteryAssetCoSharePaise: number;// e.g. 20%
  isBalanced: boolean;
  settledAt: Date;
}

