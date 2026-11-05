export enum DisputeCategory {
  FARE_DISCREPANCY = 'FARE_DISCREPANCY',
  UNAUTHORIZED_ROUTE_DETOUR = 'UNAUTHORIZED_ROUTE_DETOUR',
  DRIVER_CONDUCT = 'DRIVER_CONDUCT',
  SAFETY_CONCERN = 'SAFETY_CONCERN',
  VEHICLE_CONDITION = 'VEHICLE_CONDITION',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  AUTO_REFUNDED = 'AUTO_REFUNDED',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export interface DisputeTicketDto {
  id: string;
  ticketNumber: string;
  bookingId: string;
  complainantUserId: string;
  complainantRole: 'RIDER' | 'CAPTAIN';
  category: DisputeCategory;
  description: string;
  claimedAmountPaise?: number;
  autoRefundAppliedPaise?: number;
  reMetredDistanceVariancePercent?: number;
  status: DisputeStatus;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface LostItemReportDto {
  id: string;
  reportNumber: string;
  bookingId: string;
  riderId: string;
  itemType: string;
  itemDescription: string;
  status: 'REPORTED' | 'FOUND_BY_DRIVER' | 'RETURNED_TO_OWNER' | 'UNRESOLVED';
  tokenizedDriverContactUrl: string;
  reportedAt: string;
  returnedAt?: string;
}

