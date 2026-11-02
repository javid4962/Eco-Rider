/**
 * EcoRide Captain Application & Document Verification Contracts (EV-024)
 *
 * Defines captain onboarding application lifecycle, field validations,
 * independent driver and vehicle requirement verifications, and review history.
 */

import { VehicleCategory } from './vehicles';

export enum CaptainApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RequirementStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum VehicleOwnershipType {
  OWNED = 'OWNED', // Captain owns their electric vehicle
  FLEET_ASSIGNED = 'FLEET_ASSIGNED', // Fleet partner or platform will assign an EV
  LEASED = 'LEASED', // Leased through authorized financing partner
}

export interface CaptainApplicationReviewDto {
  id: string;
  applicationId: string;
  reviewerId?: string | null;
  reviewerName?: string | null;
  previousStatus: CaptainApplicationStatus | string;
  newStatus: CaptainApplicationStatus | string;
  driverRequirementsStatus: RequirementStatus | string;
  driverRejectionReason?: string | null;
  vehicleRequirementsStatus: RequirementStatus | string;
  vehicleRejectionReason?: string | null;
  notes?: string | null;
  reviewedAt: string;
}

export interface CaptainApplicationDto {
  id: string;
  userId: string;
  status: CaptainApplicationStatus | string;

  // Independently tracked driver requirements
  driverRequirementsStatus: RequirementStatus | string;
  driverRejectionReason?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  drivingLicenseNumber?: string | null;
  drivingLicenseExpiry?: string | null;
  badgeNumber?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  drivingLicenseDocId?: string | null;
  aadhaarDocId?: string | null;
  panDocId?: string | null;
  policeVerificationDocId?: string | null;
  profilePhotoDocId?: string | null;

  // Independently tracked vehicle requirements
  vehicleRequirementsStatus: RequirementStatus | string;
  vehicleRejectionReason?: string | null;
  vehicleOwnershipType: VehicleOwnershipType | string;
  vehicleCategory: VehicleCategory | string;
  propulsionType: string;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleRegistrationNumber?: string | null;
  batteryCapacityKwh?: number | null;
  vehicleRcDocId?: string | null;
  greenPlatePermitDocId?: string | null;
  insuranceDocId?: string | null;
  fitnessDocId?: string | null;
  createdVehicleId?: string | null;

  // Operational metadata
  city: string;
  submissionCount: number;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  lastReviewerId?: string | null;
  overallRejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  reviewHistory?: CaptainApplicationReviewDto[];
}

export interface UpdateCaptainApplicationDraftRequest {
  // Driver requirement fields
  fullName?: string;
  dateOfBirth?: string;
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: string;
  badgeNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  drivingLicenseDocId?: string;
  aadhaarDocId?: string;
  panDocId?: string;
  policeVerificationDocId?: string;
  profilePhotoDocId?: string;

  // Vehicle requirement fields
  vehicleOwnershipType?: VehicleOwnershipType | string;
  vehicleCategory?: VehicleCategory | string;
  propulsionType?: string; // Checked server-side; non-electric explicitly rejected
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleRegistrationNumber?: string;
  batteryCapacityKwh?: number;
  vehicleRcDocId?: string;
  greenPlatePermitDocId?: string;
  insuranceDocId?: string;
  fitnessDocId?: string;

  city?: string;
}

export interface SubmitCaptainApplicationRequest {
  notes?: string;
}

export interface ReviewCaptainApplicationRequest {
  overallStatus: CaptainApplicationStatus;
  driverRequirementsStatus: RequirementStatus;
  driverRejectionReason?: string;
  vehicleRequirementsStatus: RequirementStatus;
  vehicleRejectionReason?: string;
  notes?: string;
}

export interface CaptainApplicationsQuery {
  page?: number;
  limit?: number;
  status?: CaptainApplicationStatus | string;
  city?: string;
  userId?: string;
  search?: string;
}

export interface PaginatedCaptainApplicationsDto {
  items: CaptainApplicationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
