export enum RestStopLocation {
  NH16_CHILAKALURIPET_PLAZA = 'NH16_CHILAKALURIPET_PLAZA',
  NH65_NANDIGAMA_OASIS = 'NH65_NANDIGAMA_OASIS',
  NH16_HANUMAN_JUNCTION = 'NH16_HANUMAN_JUNCTION',
  AMV_OUTER_RING_WAYPOINT = 'AMV_OUTER_RING_WAYPOINT',
}

export enum VoucherStatus {
  ISSUED = 'ISSUED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface IssueRestStopVoucherDto {
  bookingId: string;
  riderId: string;
  captainId: string;
  location: RestStopLocation;
  voucherValuePaise: number;
}

export interface RestStopVoucherResult {
  voucherId: string;
  voucherCode: string;
  bookingId: string;
  location: RestStopLocation;
  valuePaise: number;
  status: VoucherStatus;
  issuedAt: string;
  expiresAt: string;
}

export interface RedeemRestStopVoucherDto {
  voucherCode: string;
  merchantId: string;
  redemptionLocation: RestStopLocation;
}

export interface RestStopRedemptionResult {
  voucherId: string;
  voucherCode: string;
  merchantId: string;
  settledAmountPaise: number;
  redeemedAt: string;
  ledgerRef: string;
}

