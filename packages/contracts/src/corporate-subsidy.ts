export enum SubsidyType {
  FULL_100_PERCENT = 'FULL_100_PERCENT',
  PERCENTAGE_SPLIT = 'PERCENTAGE_SPLIT',     // e.g. Employer covers 70%, employee pays 30%
  FIXED_PER_TRIP_CAP = 'FIXED_PER_TRIP_CAP', // e.g. Up to ₹150 per trip
}

export interface CorporateSubsidyPolicyDto {
  id: string;
  corporateAccountId: string;
  companyName: string;
  gstin: string;
  subsidyType: SubsidyType;
  subsidyPercentage?: number;
  maxPerTripSubsidyPaise?: number;
  monthlyPerEmployeeCapPaise: number;
  allowedZones: string[];
  isActive: boolean;
}

export interface EmployeeSubsidyClaimDto {
  id: string;
  bookingId: string;
  employeeUserId: string;
  corporateAccountId: string;
  totalTripFarePaise: number;
  employerSubsidizedPaise: number;
  employeePayablePaise: number;
  processedAt: string;
}

export interface CalculateSubsidyRequestDto {
  corporateAccountId: string;
  employeeUserId: string;
  farePaise: number;
  pickupZone: string;
}

export interface SubsidyBreakdownDto {
  totalFarePaise: number;
  subsidizedAmountPaise: number;
  employeeRemainingPaise: number;
  subsidyApplied: boolean;
  notes: string;
}

