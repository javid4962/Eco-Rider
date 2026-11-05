export enum PensionDeductionFrequency {
  DAILY_PER_TRIP = 'DAILY_PER_TRIP',
  DAILY_FLAT = 'DAILY_FLAT',
}

export interface CaptainPensionAccountDto {
  id: string;
  captainId: string;
  pranNumber: string; // Permanent Retirement Account Number (PFRDA)
  dailyContributionPaise: number; // e.g. 2000 paise (₹20/day)
  totalAccumulatedPaise: number;
  totalDaysContributed: number;
  isActive: boolean;
  enrolledAt: string;
}

export interface EnrollPensionDto {
  captainId: string;
  pranNumber: string;
  dailyContributionPaise: number;
}

export interface RecordPensionDeductionDto {
  captainId: string;
  deductionAmountPaise: number;
  tripId?: string;
}
