/**
 * EcoRide Identity, Roles, Scopes, and Ownership Contracts (EV-015)
 * Defines authoritative roles, operational scopes, profile structures,
 * sessions, consents, and audit event contracts.
 */

export enum PlatformRole {
  // Consumer roles
  RIDER = 'RIDER',
  CAPTAIN = 'CAPTAIN',

  // Operations & Administrative roles
  SUPPORT = 'SUPPORT',
  FINANCE = 'FINANCE',
  FLEET = 'FLEET',
  OPERATOR = 'OPERATOR',
  SUPER_ADMIN = 'SUPER_ADMIN',

  // Specialized operational partner roles (preserved for compatibility)
  DISPATCHER = 'DISPATCHER',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
  SAFETY_OFFICER = 'SAFETY_OFFICER',
  FLEET_OWNER = 'FLEET_OWNER',
  INSTITUTION_REP = 'INSTITUTION_REP',
}

/**
 * Granular Permission Scopes defined for each role
 */
export const ROLE_SCOPES: Record<string, string[]> = {
  [PlatformRole.RIDER]: ['rider:self', 'booking:create', 'booking:read:self', 'consent:write:self'],
  [PlatformRole.CAPTAIN]: [
    'driver:self',
    'shift:manage:self',
    'telemetry:emit:self',
    'booking:accept:self',
  ],
  [PlatformRole.SUPPORT]: [
    'rider:read',
    'driver:read',
    'booking:read',
    'session:read',
    'consent:read',
    'audit:read',
  ],
  [PlatformRole.FINANCE]: [
    'finance:read',
    'finance:write',
    'ledger:read',
    'payout:manage',
    'audit:read',
  ],
  [PlatformRole.FLEET]: [
    'fleet:read',
    'fleet:write',
    'vehicle:manage',
    'telemetry:read',
    'depot:manage',
  ],
  [PlatformRole.OPERATOR]: [
    'dispatch:manage',
    'zone:manage',
    'driver:shift',
    'service:toggle',
    'booking:read',
  ],
  [PlatformRole.SUPER_ADMIN]: ['*'], // Full platform governance and role administration
  // Specialized roles mapping to operational scopes
  [PlatformRole.DISPATCHER]: ['dispatch:manage', 'zone:read', 'driver:read', 'booking:read'],
  [PlatformRole.FINANCE_ADMIN]: ['finance:read', 'finance:write', 'ledger:read', 'payout:manage'],
  [PlatformRole.SAFETY_OFFICER]: ['safety:audit', 'driver:read', 'incident:manage', 'audit:read'],
  [PlatformRole.FLEET_OWNER]: ['fleet:read', 'vehicle:read'],
  [PlatformRole.INSTITUTION_REP]: ['institution:manage', 'pass:read'],
};

export enum DriverVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum ConsentType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  LOCATION_TRACKING = 'LOCATION_TRACKING',
  MARKETING = 'MARKETING',
}

export interface UserSummaryDto {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  role: PlatformRole | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppLanguage = 'te' | 'en' | 'hi';

export enum SavedAddressType {
  PICKUP = 'PICKUP',
  DROP = 'DROP',
  BOTH = 'BOTH',
}

export interface RiderProfileDto {
  id: string;
  userId: string;
  preferredLanguage: AppLanguage | string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredPaymentMode: string;
  defaultPickupNotes?: string;
  accessibilityNeeds: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriverProfileDto {
  id: string;
  userId: string;
  licenseNumber: string;
  badgeNumber?: string;
  verificationStatus: DriverVerificationStatus;
  greenPlatePermitVerified: boolean;
  safetyTrainingCompleted: boolean;
  city: string;
  assignedVehicleId?: string;
  ratingAverage: number;
  totalTrips: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSessionDto {
  id: string;
  userId: string;
  deviceId?: string;
  platform: string;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  expiresAt: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface ConsentRecordDto {
  id: string;
  userId: string;
  consentType: ConsentType | string;
  consentVersion: string;
  isGranted: boolean;
  grantedAt: string;
  revokedAt?: string;
}

export interface AuditEventDto {
  id: string;
  actorId?: string;
  targetUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  correlationId?: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  failureReason?: string;
  createdAt: string;
}

export interface UpdateRiderProfileRequest {
  name?: string;
  preferredLanguage?: AppLanguage;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredPaymentMode?: string;
  defaultPickupNotes?: string;
  accessibilityNeeds?: boolean;
}

export interface SavedLocationDto {
  id: string;
  userId: string;
  label: string;
  addressType: SavedAddressType | string;
  addressLine: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavedLocationRequest {
  label: string;
  addressType?: SavedAddressType | string;
  addressLine: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}

export interface UpdateSavedLocationRequest {
  label?: string;
  addressType?: SavedAddressType | string;
  addressLine?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface SavedLocationsPaginationQuery {
  page?: number;
  limit?: number;
  type?: SavedAddressType | string;
}

export interface PaginatedSavedLocationsDto {
  items: SavedLocationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateDriverProfileRequest {
  badgeNumber?: string;
  city?: string;
  assignedVehicleId?: string;
}

export interface ChangeUserRoleRequest {
  newRole: PlatformRole | string;
  reason: string;
}

export interface RecordConsentRequest {
  consentType: ConsentType | string;
  consentVersion: string;
  isGranted: boolean;
}
