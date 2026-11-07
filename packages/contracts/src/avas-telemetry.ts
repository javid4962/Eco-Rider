/**
 * M84: Urban Ultra-Low Sound EV Pedestrian Acoustic Alert Telemetry (AVAS Compliance - AIS-173)
 * Acoustic Vehicle Alerting System compliance monitoring at low urban speeds in AP.
 */

export enum AvasSoundStatus {
  CHIME_ACTIVE = 'CHIME_ACTIVE',
  SPEED_ABOVE_THRESHOLD = 'SPEED_ABOVE_THRESHOLD', // Above 20 km/h, road tire sound is naturally audible
  INFRACTION_MUTED = 'INFRACTION_MUTED',           // Below 20 km/h with chime muted -> statutory non-compliance
}

export interface AvasTelemetryDto {
  vehicleId: string;
  speedKmph: number;
  acousticChimeDb: number; // statutory min 56 dB(A) at 2m
  isChimeEnabled: boolean;
  latitude: number;
  longitude: number;
  isPedestrianZone: boolean; // e.g. Besant Road / Kaleswara Rao Market
  timestamp: string;
}

export interface AvasComplianceResult {
  vehicleId: string;
  status: AvasSoundStatus;
  isCompliant: boolean;
  pedestrianSafetyRisk: boolean;
  penaltyPaise: number; // ₹500 (50,000 paise) fine if muted in pedestrian zone
  notice: string;
}

