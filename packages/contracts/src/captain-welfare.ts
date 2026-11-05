export enum MedicalClaimStatus {
  SUBMITTED = 'SUBMITTED',
  OPS_VERIFIED = 'OPS_VERIFIED',
  DISBURSED = 'DISBURSED',
  REJECTED = 'REJECTED',
}

export interface WelfareFundBalanceDto {
  totalContributionsPaise: number;
  totalDisbursedPaise: number;
  currentReservePaise: number;
  activeCaptainsCovered: number;
}

export interface MedicalClaimRequestDto {
  captainId: string;
  hospitalName: string;
  treatmentType: string;
  claimAmountPaise: number;
  dischargeSummaryUrl: string;
}

export interface MedicalClaimDto {
  id: string;
  claimNumber: string;
  captainId: string;
  hospitalName: string;
  treatmentType: string;
  claimAmountPaise: number;
  approvedAmountPaise: number;
  status: MedicalClaimStatus;
  disbursedUtr?: string;
  submittedAt: string;
  processedAt?: string;
}

