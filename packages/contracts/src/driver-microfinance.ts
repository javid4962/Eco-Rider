export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  DELINQUENT = 'DELINQUENT',
  CLOSED = 'CLOSED',
}

export interface CaptainEmiPlanDto {
  id: string;
  captainId: string;
  lenderName: string;
  loanAccountNumber: string;
  totalPrincipalPaise: number;
  totalInterestPaise: number;
  dailyEmiInstallmentPaise: number;
  remainingBalancePaise: number;
  totalPaidPaise: number;
  maxDeductionCapPercentage: number; // e.g. Max 25% of gross daily earnings
  status: LoanStatus;
  startDate: string;
  endDate: string;
}

export interface ExecuteDailyEmiDeductionDto {
  captainId: string;
  grossEarningsTodayPaise: number;
  date: string;
}

export interface EmiDeductionResultDto {
  deductionId: string;
  captainId: string;
  grossEarningsPaise: number;
  requestedEmiPaise: number;
  actualDeductedPaise: number;
  escrowTransferredToLenderPaise: number;
  remainingLenderBalancePaise: number;
  cappedBySafetyRule: boolean;
  notes: string;
}

