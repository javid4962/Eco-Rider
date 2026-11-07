export type NcmcCardType = 'RUPAY_CONTACTLESS' | 'APSRTC_SMART_PASS' | 'NCMC_VIRTUAL';
export type NcmcPaymentStatus = 'AUTHORIZED' | 'SETTLED' | 'REJECTED';

export interface NcmcPaymentInitiationRequest {
  bookingId: string;
  riderId: string;
  cardIdentifierHash: string; // SHA-256 masked pan/card ID
  cardType: NcmcCardType;
  farePaise: number;
  terminalId: string;
  posLocationCode: string; // e.g. "BZA_PNBS_01"
}

export interface NcmcPaymentRecord {
  id: string;
  transactionId: string;
  bookingId: string;
  riderId: string;
  cardIdentifierHash: string;
  cardType: NcmcCardType;
  farePaise: number;
  clearinghouseBatchId: string;
  status: NcmcPaymentStatus;
  authorizedAt: string;
  settledAt?: string;
}

