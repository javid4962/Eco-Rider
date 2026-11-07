export type RainCoverRentalStatus = 'ISSUED' | 'RETURNED' | 'FORFEITED_DAMAGE';

export interface IssueRainCoverRequest {
  captainId: string;
  vehicleId: string;
  depotHubId: string;
  depositPaise: number; // e.g. 50000 paise (Rs 500)
  dailyRentalPaise: number; // e.g. 2000 paise/day (Rs 20)
}

export interface ReturnRainCoverRequest {
  sessionId: string;
  depotHubId: string;
  damageDeductionPaise: number;
}

export interface RainCoverEscrowSessionRecord {
  id: string;
  captainId: string;
  vehicleId: string;
  depotHubId: string;
  depositPaise: number;
  dailyRentalPaise: number;
  accumulatedRentalPaise: number;
  refundedDepositPaise: number;
  status: RainCoverRentalStatus;
  issuedAt: string;
  returnedAt?: string;
}

