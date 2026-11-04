/**
 * EcoRide Ride State Machine & Authorization Contracts (EV-038)
 * Authoritative lifecycle statuses, actor permission rules,
 * transition payloads, timestamps, and immutable event log contracts.
 */

export enum RideStatus {
  REQUESTED = 'REQUESTED',
  DISPATCHING = 'DISPATCHING',
  ASSIGNED = 'ASSIGNED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum RideActorRole {
  RIDER = 'RIDER',
  CAPTAIN = 'CAPTAIN',
  DISPATCHER = 'DISPATCHER',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
  SAFETY_OFFICER = 'SAFETY_OFFICER',
  SYSTEM = 'SYSTEM',
}

/**
 * Terminal statuses from which no further transitions are legally allowed.
 */
export const TERMINAL_RIDE_STATUSES: readonly RideStatus[] = Object.freeze([
  RideStatus.COMPLETED,
  RideStatus.CANCELLED,
  RideStatus.FAILED,
]);

/**
 * Authoritative DAG (Directed Acyclic Graph) of legal status transitions.
 * Any jump outside this graph is strictly rejected with ILLEGAL_STATUS_TRANSITION.
 */
export const VALID_RIDE_TRANSITIONS: Record<RideStatus, readonly RideStatus[]> = Object.freeze({
  [RideStatus.REQUESTED]: Object.freeze([
    RideStatus.DISPATCHING,
    RideStatus.CANCELLED,
    RideStatus.FAILED,
  ]),
  [RideStatus.DISPATCHING]: Object.freeze([
    RideStatus.ASSIGNED,
    RideStatus.CANCELLED,
    RideStatus.FAILED,
  ]),
  [RideStatus.ASSIGNED]: Object.freeze([
    RideStatus.ARRIVED,
    RideStatus.CANCELLED,
    RideStatus.FAILED,
  ]),
  [RideStatus.ARRIVED]: Object.freeze([
    RideStatus.IN_PROGRESS,
    RideStatus.CANCELLED,
    RideStatus.FAILED,
  ]),
  [RideStatus.IN_PROGRESS]: Object.freeze([
    RideStatus.COMPLETED,
    RideStatus.CANCELLED,
    RideStatus.FAILED,
  ]),
  [RideStatus.COMPLETED]: Object.freeze([]),
  [RideStatus.CANCELLED]: Object.freeze([]),
  [RideStatus.FAILED]: Object.freeze([]),
});

/**
 * Immutable Ride State Transition Event Record
 */
export interface RideStateEventDto {
  id: string;
  bookingId: string;
  fromStatus: RideStatus | string | null;
  toStatus: RideStatus | string;
  actorId: string;
  actorRole: RideActorRole | string;
  metadata: Record<string, unknown>;
  createdAt: string; // ISO-8601 UTC
}

/**
 * Request payload for transitioning a ride's state
 */
export interface TransitionRideStatusRequest {
  targetStatus: RideStatus;
  captainId?: string;
  vehicleId?: string;
  startOtp?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Complete ride state machine transition response
 */
export interface TransitionRideStatusResponse {
  bookingId: string;
  bookingCode: string;
  previousStatus: RideStatus | string;
  currentStatus: RideStatus | string;
  riderId: string;
  captainId?: string | null;
  vehicleId?: string | null;
  serviceCategory: string;
  timestamps: {
    requestedAt: string;
    dispatchingAt?: string | null;
    assignedAt?: string | null;
    arrivedAt?: string | null;
    tripStartedAt?: string | null;
    tripCompletedAt?: string | null;
    cancelledAt?: string | null;
    failedAt?: string | null;
  };
  cancellationDetails?: {
    reason: string;
    cancelledByRole: string;
    cancelledById: string;
  } | null;
  failureDetails?: {
    reason: string;
  } | null;
  transitionEvent: RideStateEventDto;
}

/**
 * Timeline query response containing full immutable audit log
 */
export interface RideTimelineResponse {
  bookingId: string;
  bookingCode: string;
  currentStatus: RideStatus | string;
  eventsCount: number;
  events: RideStateEventDto[];
}

/**
 * Ride Incident Severity Levels
 */
export type RideIncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Ride Incident Resolution Lifecycle Statuses
 */
export type RideIncidentStatus =
  'REPORTED' | 'INVESTIGATING' | 'ESCALATED_POLICE_112' | 'RESOLVED' | 'CLOSED';

/**
 * Common Ride Incident Types
 */
export type RideIncidentType =
  | 'SOS_TRIGGERED'
  | 'SAFETY_STOP'
  | 'ACCIDENT_REPORT'
  | 'ROUTE_DEVIATION'
  | 'DRIVER_BEHAVIOR'
  | 'BATTERY_HAZARD'
  | 'OTHER';

/**
 * Immutable Ride Incident Record
 */
export interface RideIncidentDto {
  id: string;
  bookingId: string;
  incidentCode: string;
  incidentType: RideIncidentType | string;
  severity: RideIncidentSeverity | string;
  status: RideIncidentStatus | string;
  reportedById: string;
  reportedByRole: string;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload to report a safety or operational incident
 */
export interface CreateRideIncidentRequest {
  incidentType: RideIncidentType | string;
  severity?: RideIncidentSeverity | string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cancellation policy response details including ledger & incident preservation (EV-039)
 */
export interface CancelRidePolicyResponse extends TransitionRideStatusResponse {
  cancellationFeePaise: number;
  formattedCancellationFee: string;
  gracePeriodExpired: boolean;
  ledgerEntriesCreated: number;
  ledgerEntriesPreserved: boolean;
  activeIncidentsCount: number;
  activeIncidents: {
    id: string;
    incidentCode: string;
    incidentType: string;
    severity: string;
    status: string;
  }[];
}

/**
 * Financial ledger transaction entry linked to ride
 */
export interface RideLedgerEntryDto {
  id: string;
  bookingId?: string | null;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amountPaise: number;
  currency: string;
  description?: string | null;
  idempotencyKey: string;
  createdAt: string;
}

/**
 * Response payload for rotating/regenerating ride start OTP (EV-045)
 */
export interface RotateStartOtpResponse {
  bookingId: string;
  bookingCode: string;
  startOtp?: string; // Revealed only to authorized rider or admin
  expiresAt: string; // ISO-8601 UTC
  rotatedAt: string; // ISO-8601 UTC
  remainingAttempts: number;
}

/**
 * Ride start OTP verification payload (EV-045)
 */
export interface StartRideOtpVerificationDto {
  startOtp: string;
  metadata?: Record<string, unknown>;
}
