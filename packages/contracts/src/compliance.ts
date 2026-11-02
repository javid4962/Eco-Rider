/**
 * EcoRide Captain Compliance & Assignment Eligibility Contracts (EV-025)
 *
 * Defines the 6-state compliance lifecycle (PENDING, UNDER_REVIEW, VERIFIED, REJECTED, SUSPENDED, EXPIRED),
 * duty status transitions (ONLINE, OFFLINE, ON_TRIP), and multi-dimensional assignment eligibility
 * derived from approvals, unexpired statutory documents, roadworthy BEVs, and authorized AP pilot zones.
 */

export enum DriverComplianceStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
}

export enum DutyStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ON_TRIP = 'ON_TRIP',
}

export interface CaptainApprovalDetails {
  driverApproved: boolean;
  vehicleApproved: boolean;
  safetyTrainingCompleted: boolean;
  greenPlatePermitVerified: boolean;
  backgroundCheckCleared?: boolean;
}

export interface CaptainDocumentValidity {
  licenseValid: boolean;
  licenseNumber: string;
  licenseExpiryDate?: string | null;
  licenseDaysRemaining?: number | null;
  badgeNumber?: string | null;
  vehicleAssigned: boolean;
  assignedVehicleId?: string | null;
  vehicleRegistrationNumber?: string | null;
  vehicleRoadworthy: boolean;
  vehiclePropulsionValid: boolean;
  vehicleInsuranceValid: boolean;
  vehicleFitnessValid: boolean;
  vehiclePermitValid: boolean;
  batterySocAdequate: boolean;
  batterySocPercent: number;
}

export interface CaptainZonePermission {
  city: string;
  zoneAllowed: boolean;
  serviceAllowed: boolean;
  releasePhase?: string;
  reason?: string | null;
}

export interface CaptainEligibilityDto {
  captainId: string;
  userId: string;
  complianceStatus: DriverComplianceStatus | string;
  isDraftComplete: boolean;
  isEligibleForAssignment: boolean;
  dutyStatus: DutyStatus | string;
  dutyLastToggledAt?: string | null;
  suspensionReason?: string | null;
  complianceNotes?: string | null;
  approvalDetails: CaptainApprovalDetails;
  documentValidity: CaptainDocumentValidity;
  zonePermission: CaptainZonePermission;
  ineligibilityReasons: string[];
  evaluatedAt: string;
}

export interface ToggleDutyRequest {
  status: DutyStatus;
}

export interface ToggleDutyResponse {
  dutyStatus: DutyStatus;
  eligible: boolean;
  captainId: string;
  userId: string;
  assignedVehicleId?: string | null;
  city: string;
  lastToggledAt: string;
  message: string;
}

export interface UpdateComplianceStatusRequest {
  status: DriverComplianceStatus;
  suspensionReason?: string;
  notes?: string;
}

/**
 * Compliance Expiry Warning Tiers (EV-029)
 * Advance warning windows prior to statutory document expiration.
 */
export enum ComplianceWarningTier {
  WARNING_30D = 'WARNING_30D',
  WARNING_15D = 'WARNING_15D',
  WARNING_7D = 'WARNING_7D',
  WARNING_1D = 'WARNING_1D',
  EXPIRED = 'EXPIRED',
}

export type ComplianceTargetType =
  'DRIVER_LICENSE' | 'VEHICLE_INSURANCE' | 'VEHICLE_FITNESS' | 'VEHICLE_PERMIT';

export interface ComplianceExpiryWarning {
  id?: string;
  targetType: ComplianceTargetType;
  targetId: string;
  targetIdentifier: string;
  userId: string;
  captainName?: string;
  expiryDate: string;
  daysRemaining: number;
  warningTier: ComplianceWarningTier;
  isResolved: boolean;
  resolvedAt?: string | null;
  resolutionType?: string | null;
  actionRequired: string;
  dutyStatus?: DutyStatus | string;
  complianceStatus?: DriverComplianceStatus | string;
  createdAt?: string;
}

export interface ComplianceScanSummaryDto {
  scannedAt: string;
  totalProfilesScanned: number;
  totalVehiclesScanned: number;
  warningsIssued: number;
  accountsSuspendedOrExpired: number;
  warnings: ComplianceExpiryWarning[];
}

export interface ReverifyComplianceRequest {
  targetUserId?: string;
  targetType: ComplianceTargetType;
  newExpiryDate: string;
  documentId: string;
  newDocumentNumber?: string;
  notes?: string;
}

export interface ReverifyComplianceResponse {
  success: boolean;
  message: string;
  targetType: ComplianceTargetType;
  targetId: string;
  userId: string;
  updatedExpiryDate: string;
  resolvedWarningsCount: number;
  eligibility: CaptainEligibilityDto;
}

export interface ComplianceWarningsQuery {
  userId?: string;
  targetType?: ComplianceTargetType;
  warningTier?: ComplianceWarningTier;
  isResolved?: boolean;
}
