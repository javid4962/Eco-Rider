export enum CostCenterStatus {
  ACTIVE = 'ACTIVE',
  EXCEEDED_FROZEN = 'EXCEEDED_FROZEN',
  DEACTIVATED = 'DEACTIVATED',
}

export interface CreateCostCenterDto {
  corporateAccountId: string;
  departmentCode: string;
  departmentName: string;
  monthlyBudgetLimitPaise: number;
}

export interface AuthorizeCorporateRideDto {
  corporateAccountId: string;
  departmentCode: string;
  employeeId: string;
  estimatedFarePaise: number;
}

export interface CostCenterAuthorizationResult {
  isApproved: boolean;
  costCenterId: string;
  departmentCode: string;
  currentSpendPaise: number;
  monthlyBudgetLimitPaise: number;
  remainingBudgetPaise: number;
  rejectionReason: string | null;
}
