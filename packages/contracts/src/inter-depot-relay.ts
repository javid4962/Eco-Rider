/**
 * M85: Dynamic Multi-Hop Autonomous Parcel Locker Inter-Depot Courier Relay
 * Linehaul EV logistics scheduling between Vijayawada, Mangalagiri, and Guntur smart locker micro-hubs.
 */

export enum RelayHopStatus {
  SCHEDULED = 'SCHEDULED',
  IN_TRANSIT = 'IN_TRANSIT',
  TRANSFERRED_TO_NEXT_HOP = 'TRANSFERRED_TO_NEXT_HOP',
  DELIVERED_TO_DESTINATION_LOCKER = 'DELIVERED_TO_DESTINATION_LOCKER',
}

export interface CreateInterDepotRelayDto {
  consignmentId: string;
  originLockerHubId: string;
  transitDepotId: string;
  destinationLockerHubId: string;
  courierVanVehicleId: string;
  courierCaptainId: string;
  weightGrams: number;
}

export interface RelayHandshakeVerificationDto {
  relayId: string;
  currentDepotId: string;
  handedOverByCaptainId: string;
  receivedByCaptainId: string;
  otpCode: string;
}

export interface InterDepotRelayResult {
  relayId: string;
  consignmentId: string;
  status: RelayHopStatus;
  currentLocationHub: string;
  nextScheduledHub: string;
  verificationToken: string;
  updatedAt: string;
}

