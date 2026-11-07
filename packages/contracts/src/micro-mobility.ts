/**
 * M86: Community Micro-Mobility Shared Electric Kick-Scooter & E-Cycle Depot Docking
 * First/last-mile zero-emission micro-mobility pods in Amaravathi Secretariat & university campuses.
 */

export enum MicroMobilityVehicleType {
  E_KICK_SCOOTER = 'E_KICK_SCOOTER',
  PEDAL_ASSIST_E_CYCLE = 'PEDAL_ASSIST_E_CYCLE',
}

export enum MicroMobilitySessionStatus {
  UNLOCKED = 'UNLOCKED',
  RIDING = 'RIDING',
  DOCKED_COMPLETED = 'DOCKED_COMPLETED',
  OUT_OF_ZONE_LOCKED = 'OUT_OF_ZONE_LOCKED',
}

export interface StartMicroMobilitySessionDto {
  userId: string;
  vehicleCode: string; // e.g. SCOOT-AMAR-04
  vehicleType: MicroMobilityVehicleType;
  dockStationId: string;
  userWalletBalancePaise: number; // minimum ₹50 pre-auth (5,000 paise)
}

export interface EndMicroMobilitySessionDto {
  sessionId: string;
  dockStationId: string;
  distanceMeters: number;
  durationMinutes: number;
}

export interface MicroMobilityBillingResult {
  sessionId: string;
  vehicleCode: string;
  status: MicroMobilitySessionStatus;
  durationMinutes: number;
  baseUnlockFeePaise: number; // ₹10 (1,000 paise)
  perMinuteFeePaise: number; // ₹2/min (200 paise/min)
  gstPaise: number; // 5% SAC 996412
  totalChargedPaise: number;
  dockStationVerified: boolean;
}

