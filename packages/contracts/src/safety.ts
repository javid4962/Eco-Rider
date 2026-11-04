/**
 * EcoRide 24/7 Safety Console & Emergency SOS Contracts (EV-129 – EV-131)
 * Critical incident management, AP Police 112 emergency escalation,
 * tokenized live ride tracking for emergency contacts, and audio consent recording.
 */

import { RideStatus } from './rides';

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentStatus {
  REPORTED = 'REPORTED',
  INVESTIGATING = 'INVESTIGATING',
  ESCALATED_POLICE = 'ESCALATED_POLICE',
  RESOLVED = 'RESOLVED',
  FALSE_ALARM = 'FALSE_ALARM',
}

export interface TriggerSosDto {
  bookingId: string;
  latitude: number;
  longitude: number;
  reason?: string;
  audioRecordingConsent?: boolean;
}

export interface SosAlertResponseDto {
  incidentId: string;
  incidentCode: string;
  bookingId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  apPolice112Dispatched: boolean;
  apPoliceReferenceId: string;
  emergencyContactsNotified: number;
  liveTrackingToken: string;
  liveTrackingUrl: string;
  audioRecordingActive: boolean;
  createdAt: string;
}

export interface LiveTrackingDto {
  trackingToken: string;
  bookingCode: string;
  rideStatus: RideStatus;
  pickupAddress: string;
  dropAddress: string;
  captainName: string;
  captainPhoneMasked: string;
  vehiclePlate: string;
  vehicleModel: string;
  captainLatitude: number;
  captainLongitude: number;
  etaMinutes: number;
  isSosActive: boolean;
  lastLocationUpdate: string;
}

export interface ResolveIncidentDto {
  resolutionNotes: string;
  actionTaken: string;
  status: IncidentStatus.RESOLVED | IncidentStatus.FALSE_ALARM;
}

export interface SafetyIncidentSummaryDto {
  id: string;
  incidentCode: string;
  bookingId: string;
  bookingCode: string;
  incidentType: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedById: string;
  reportedByRole: string;
  description: string;
  apPoliceDispatched: boolean;
  apPoliceReferenceId?: string;
  audioRecordingActive: boolean;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

