/**
 * EcoRide Privacy, Consent, Data Portability, and Erasure Contracts (EV-020)
 *
 * Implements authoritative DPDP (Digital Personal Data Protection Act, 2023)
 * compliance, purpose-specific location consents, communications opt-ins,
 * portable data export, and deletion workflows with statutory retention exceptions.
 */

import { ConsentType, RecordConsentRequest } from './identity';

export { ConsentType, RecordConsentRequest };

export interface PolicyVersionDto {
  policyType: ConsentType | string;
  version: string;
  isMandatory: boolean;
  title: string;
  effectiveDate: string;
  summary: string;
}

export interface RevokeConsentRequest {
  consentType: ConsentType | string;
  reason?: string;
}

export interface EvaluatePermissionRequest {
  permission:
    | 'MARKETING_SMS'
    | 'MARKETING_EMAIL'
    | 'PROMOTIONAL_PUSH'
    | 'LOCATION_NEARBY_OFFERS'
    | 'LOCATION_TRIP_PROCESSING'
    | string;
}

export interface EvaluatePermissionResultDto {
  permission: string;
  isAllowed: boolean;
  consentStatus: 'GRANTED' | 'REVOKED' | 'NOT_RECORDED';
  reason: string;
}

export interface StatutoryRetentionExceptionDto {
  category: string;
  statutoryBasis: string;
  retentionPeriod: string;
  retentionPeriodYears: number;
  scope: string;
}

export interface DataExportDto {
  exportId: string;
  exportedAt: string;
  statutoryBasis: string;
  user: {
    id: string;
    phoneMasked: string;
    emailMasked?: string;
    name?: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  riderProfile?: Record<string, unknown>;
  driverProfile?: Record<string, unknown>;
  consents: Array<{
    consentType: string;
    consentVersion: string;
    isGranted: boolean;
    grantedAt: string;
    revokedAt?: string;
  }>;
  savedLocations: Array<Record<string, unknown>>;
  sessions: Array<{
    deviceId?: string;
    platform: string;
    lastActiveAt: string;
    createdAt: string;
  }>;
  bookingsSummary: {
    totalBookings: number;
    completedBookings: number;
  };
}

export enum DeletionRequestStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export interface CreateDataDeletionRequest {
  reason?: string;
  confirmUnderstandRetention: boolean;
}

export interface DataDeletionResponseDto {
  requestId: string;
  userId: string;
  status: DeletionRequestStatus;
  erasedAt?: string;
  erasedItems: string[];
  mandatoryRetentionExceptions: StatutoryRetentionExceptionDto[];
  disclosure: string;
  rejectionReason?: string;
}

export interface DataDeletionRecordDto {
  id: string;
  userId: string;
  status: DeletionRequestStatus;
  reason?: string;
  rejectionReason?: string;
  erasedItems: string[];
  mandatoryRetentionExceptions: StatutoryRetentionExceptionDto[];
  processedAt?: string;
  createdAt: string;
}
