export enum CarbonStandard {
  ISO_14064_PART1 = 'ISO_14064_PART1',
  GHG_PROTOCOL_SCOPE3_CAT6 = 'GHG_PROTOCOL_SCOPE3_CAT6',
  BEE_PAT_COMPLIANT = 'BEE_PAT_COMPLIANT',
}

export enum OffsetVerificationStatus {
  CERTIFIED = 'CERTIFIED',
  PROVISIONAL = 'PROVISIONAL',
}

export interface GenerateScope3CertificateDto {
  corporateAccountId: string;
  reportingMonth: string; // e.g. "2026-11"
  standard: CarbonStandard;
  totalElectricKm: number;
  isCargoMovement: boolean;
}

export interface Scope3CarbonCertificateResult {
  certificateId: string;
  corporateAccountId: string;
  reportingMonth: string;
  standard: CarbonStandard;
  avoidedCo2Kg: number;
  displacedDieselLiters: number;
  verificationStatus: OffsetVerificationStatus;
  certificateHashSha256: string;
  certifiedAt: Date;
}

