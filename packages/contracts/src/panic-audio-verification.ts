/**
 * M88: Captain Emergency Health Hotline & In-Ride Panic Audio Stream Verification
 * Real-time audio stream recording verification and emergency police dispatch routing.
 */

export enum IncidentSeverityLevel {
  P0_CRITICAL_POLICE_DISPATCH = 'P0_CRITICAL_POLICE_DISPATCH',
  P1_URGENT_OPERATIONS_CALL = 'P1_URGENT_OPERATIONS_CALL',
  P2_FALSE_ALARM_RESOLVED = 'P2_FALSE_ALARM_RESOLVED',
}

export interface IngestPanicAudioStreamDto {
  rideId: string;
  captainId: string;
  riderId: string;
  audioDurationSeconds: number;
  audioSha256Checksum: string;
  streamDecibelsMax: number;
  latitude: number;
  longitude: number;
  sosTriggerSource: 'RIDER_APP' | 'CAPTAIN_APP' | 'HARDWARE_PANIC_BUTTON';
}

export interface PanicIncidentAssessmentResult {
  incidentId: string;
  rideId: string;
  severity: IncidentSeverityLevel;
  police112Notified: boolean;
  policeDispatchToken: string;
  audioVerified: boolean;
  actionTaken: string;
  timestamp: string;
}

