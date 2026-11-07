export enum NoParkingZoneCode {
  BENZ_CIRCLE_FLYOVER = 'BENZ_CIRCLE_FLYOVER',
  PRAKASAM_BARRAGE_PEDESTRIAN = 'PRAKASAM_BARRAGE_PEDESTRIAN',
  AIIMS_EMERGENCY_CORRIDOR = 'AIIMS_EMERGENCY_CORRIDOR',
  BANDAR_ROAD_RAMP = 'BANDAR_ROAD_RAMP',
}

export enum BountyStatus {
  OPEN = 'OPEN',
  CLAIMED = 'CLAIMED',
  VERIFIED_REDOCKED = 'VERIFIED_REDOCKED',
  EXPIRED = 'EXPIRED',
}

export interface VerifyDockingLocationDto {
  vehicleId: string;
  sessionId: string;
  latitude: number;
  longitude: number;
}

export interface DockingValidationResult {
  vehicleId: string;
  isAllowedToLock: boolean;
  isInNoParkingZone: boolean;
  zoneCode?: NoParkingZoneCode;
  penaltyFeePaise: number;
  bountyCreated: boolean;
  message: string;
}

export interface ClaimBountyDto {
  bountyId: string;
  captainId: string;
}

export interface CompleteBountyRedockDto {
  bountyId: string;
  captainId: string;
  dockedHubId: string;
}

export interface BountySettlementResult {
  bountyId: string;
  vehicleId: string;
  captainId: string;
  rewardPaise: number;
  status: BountyStatus;
  completedAt: string;
}

