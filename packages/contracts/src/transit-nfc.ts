export enum NfcCardType {
  APSRTC_PASS_CARD = 'APSRTC_PASS_CARD',
  AMARAVATHI_METRO_SMART_PASS = 'AMARAVATHI_METRO_SMART_PASS',
  RUPAY_NCMC_TRANSIT = 'RUPAY_NCMC_TRANSIT',
}

export interface TransitSmartCardDto {
  id: string;
  cardUidHash: string;
  userId: string;
  cardType: NfcCardType;
  linkedWalletBalancePaise: number;
  lastTapStationCode?: string;
  isActive: boolean;
  issuedAt: string;
}

export interface NfcTapValidationDto {
  cardUidHash: string;
  stationCode: string;
  fareDeductionPaise: number;
  tapType: 'ENTRY' | 'EXIT';
}

export interface NfcTapResultDto {
  transactionId: string;
  cardUidHash: string;
  stationCode: string;
  fareDeductedPaise: number;
  remainingBalancePaise: number;
  gateOpened: boolean;
  tappedAt: string;
}

