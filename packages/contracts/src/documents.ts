/**
 * EcoRide Secure Document & KYC Management Contracts (EV-022)
 *
 * Defines document types, verification statuses, retention policies,
 * presigned access DTOs, and upload/inspection structures.
 */

export enum DocumentType {
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  GREEN_PLATE_PERMIT = 'GREEN_PLATE_PERMIT', // AP 100% BEV Commercial Transport Permit
  VEHICLE_RC = 'VEHICLE_RC',
  AADHAAR = 'AADHAAR',
  PAN = 'PAN',
  POLICE_VERIFICATION = 'POLICE_VERIFICATION',
  PROFILE_PHOTO = 'PROFILE_PHOTO',
  VEHICLE_INSURANCE = 'VEHICLE_INSURANCE',
  COMMERCIAL_FITNESS = 'COMMERCIAL_FITNESS',
}

export enum DocumentStatus {
  PENDING_SCAN = 'PENDING_SCAN',
  CLEAN = 'CLEAN',
  INFECTED = 'INFECTED',
  QUARANTINED = 'QUARANTINED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum RetentionPolicy {
  // Motor Vehicles Act 1988/2019 & AP Aggregator Rules: 5-year statutory retention for transport captain KYC
  KYC_STATUTORY_5_YEARS = 'KYC_STATUTORY_5_YEARS',
  // Temporary session or dispute artifacts: 90-day retention
  TEMPORARY_90_DAYS = 'TEMPORARY_90_DAYS',
  // Standard account lifetime retention
  PERMANENT_ACCOUNT_LIFETIME = 'PERMANENT_ACCOUNT_LIFETIME',
}

export interface DocumentMetadataDto {
  id: string;
  userId: string;
  documentType: DocumentType | string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  scanStatus: DocumentStatus | string;
  scanDetails?: Record<string, unknown>;
  retentionPolicy: RetentionPolicy | string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PresignedAccessDto {
  url: string;
  token: string;
  storageKey: string;
  expiresAt: string;
  documentId: string;
}

export interface UploadDocumentRequest {
  documentType: DocumentType | string;
  filename: string;
  mimeType: string;
  contentBase64: string;
  retentionPolicy?: RetentionPolicy | string;
}

export interface PresignedUploadRequest {
  documentType: DocumentType | string;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  retentionPolicy?: RetentionPolicy | string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  storageKey: string;
  uploadToken: string;
  expiresAt: string;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
}

export interface DocumentsPaginationQuery {
  page?: number;
  limit?: number;
  documentType?: DocumentType | string;
  userId?: string;
}

export interface PaginatedDocumentsDto {
  items: DocumentMetadataDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
