/**
 * M77: Corporate Green Travel Multi-Level Approval Workflow & Expense Management Sync
 * Enterprise ESG mobility rules, approval hierarchies, and budget management.
 */

export enum CorporateApprovalStatus {
  AUTO_APPROVED = 'AUTO_APPROVED',
  PENDING_MANAGER_APPROVAL = 'PENDING_MANAGER_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CorporateRequisitionDto {
  corporateAccountId: string;
  departmentCode: string;
  employeeUserId: string;
  managerUserId: string;
  tripPurpose: string;
  estimatedFarePaise: number;
  originAddress: string;
  destinationAddress: string;
}

export interface ReviewCorporateRequisitionDto {
  requisitionId: string;
  reviewerUserId: string;
  action: 'APPROVE' | 'REJECT';
  comments?: string;
}

export interface CorporateRequisitionResult {
  id: string;
  corporateAccountId: string;
  employeeUserId: string;
  status: CorporateApprovalStatus;
  approvedFareCapPaise: number;
  departmentBudgetRemainingPaise: number;
  gstTaxInvoiceEligible: boolean;
  reviewedBy?: string;
  decisionNote?: string;
}

