export enum InterStateCorridor {
  VIJAYAWADA_HYDERABAD_NH65 = 'VIJAYAWADA_HYDERABAD_NH65',
  GUNTUR_HYDERABAD_SH2 = 'GUNTUR_HYDERABAD_SH2',
  KURNOOL_HYDERABAD_NH44 = 'KURNOOL_HYDERABAD_NH44',
}

export enum InterStatePermitStatus {
  VALID_RECIPROCAL = 'VALID_RECIPROCAL',
  BORDER_TEMP_PASS = 'BORDER_TEMP_PASS',
  EXPIRED_BLOCKED = 'EXPIRED_BLOCKED',
}

export interface ValidateInterStatePermitDto {
  vehicleId: string;
  corridor: InterStateCorridor;
  permitNumber: string;
  hasGreenCommercialPlate: boolean;
  isReciprocalAgreementActive: boolean;
  fastagBalancePaise: number;
}

export interface InterStatePermitValidationResult {
  vehicleId: string;
  status: InterStatePermitStatus;
  isClearedForBorderTransit: boolean;
  borderTollDeductionPaise: number;
  fastagDeducted: boolean;
  interStateTransitManifestId: string;
}

