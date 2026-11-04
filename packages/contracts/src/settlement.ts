/**
 * EcoRide Authoritative Driver & Fleet Owner Settlement Contracts (EV-055 – EV-056)
 * Wallet balance aggregation from immutable ledger entries, cash liability offsets,
 * minimum escrow holdback retention, and weekly payout batch approvals.
 */

export enum PayoutBatchStatus {
  PROPOSED = 'PROPOSED',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export enum PayoutItemStatus {
  PENDING = 'PENDING',
  DISBURSED = 'DISBURSED',
  FAILED = 'FAILED',
  SKIPPED_INSUFFICIENT_BALANCE = 'SKIPPED_INSUFFICIENT_BALANCE',
}

export enum SettlementRecipientType {
  CAPTAIN = 'CAPTAIN',
  FLEET_OWNER = 'FLEET_OWNER',
}

export interface CaptainEarningsSummaryDto {
  captainId: string;
  currency: 'INR';
  grossEarningsPaise: number;
  cashCollectedOffsetPaise: number;
  previousDisbursalsPaise: number;
  escrowReservePaise: number;
  netPayablePaise: number;
  formattedNetPayable: string;
  totalTripsCompleted: number;
  recentLedgerEntries: Array<{
    id: string;
    entryType: 'DEBIT' | 'CREDIT';
    amountPaise: number;
    description?: string;
    createdAt: string;
  }>;
}

export interface CreatePayoutBatchDto {
  periodStart: string;
  periodEnd: string;
  minimumPayoutThresholdPaise?: number; // e.g. 50000 = ₹500 min threshold
  escrowReservePaise?: number; // e.g. 10000 = ₹100 reserve retention
  notes?: string;
}

export interface ApprovePayoutBatchDto {
  notes?: string;
}

export interface PayoutItemDto {
  id: string;
  batchId: string;
  recipientType: SettlementRecipientType;
  recipientId: string;
  payoutAccountId: string;
  grossEarningsPaise: number;
  cashCollectedOffsetPaise: number;
  netDisbursalPaise: number;
  formattedNetDisbursal: string;
  escrowReservePaise: number;
  status: PayoutItemStatus;
  gatewayPayoutId?: string | null;
  idempotencyKey: string;
  createdAt: string;
}

export interface PayoutBatchDto {
  id: string;
  batchNumber: string;
  status: PayoutBatchStatus;
  totalDisbursalPaise: number;
  formattedTotal: string;
  totalItemsCount: number;
  periodStart: string;
  periodEnd: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  notes?: string | null;
  items?: PayoutItemDto[];
  createdAt: string;
  updatedAt: string;
}

