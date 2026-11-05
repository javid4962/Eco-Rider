/**
 * M76: Automated Statutory AP Transport Department (AP-STA) Digital Permit Issuance & Fleet Compliance Renewal
 * Compliance automation adhering to Andhra Pradesh Motor Vehicles Rules & AP EV Policy 2024–2029.
 */

export enum PermitType {
  EV_STAGE_CARRIAGE = 'EV_STAGE_CARRIAGE',
  EV_CONTRACT_CARRIAGE = 'EV_CONTRACT_CARRIAGE',
  EV_GOODS_CARRIER = 'EV_GOODS_CARRIER',
}

export enum PermitComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  EXPIRING_SOON = 'EXPIRING_SOON', // Within 30 days
  EXPIRED = 'EXPIRED',
  RENEWAL_SUBMITTED = 'RENEWAL_SUBMITTED',
}

export interface DigitalPermitRecordDto {
  permitNumber: string; // e.g. AP39-EV-PERMIT-2026-0042
  vehicleId: string;
  registrationNumber: string; // e.g. AP 16 EV 9090
  permitType: PermitType;
  rtoOfficeCode: string; // e.g. AP-16 (Vijayawada), AP-07 (Guntur)
  validFrom: string;
  validUntil: string;
  pucExempt: boolean; // Strictly true for BEV under AP EV Policy
  roadTaxExempt: boolean; // Strictly true for BEV under AP EV Policy
  status: PermitComplianceStatus;
  verificationHash: string; // SHA-256 digital certificate
}

export interface RenewPermitDto {
  permitNumber: string;
  renewalDurationMonths: number; // e.g. 12 or 60 months
}

export interface PermitRenewalResult {
  permitNumber: string;
  status: PermitComplianceStatus;
  newValidUntil: string;
  statutoryFeePaise: number; // e.g. 150000 paise (₹1,500 statutory green permit fee)
  newVerificationHash: string;
  message: string;
}
