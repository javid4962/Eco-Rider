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
