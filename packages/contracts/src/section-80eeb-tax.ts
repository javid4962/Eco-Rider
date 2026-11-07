export interface TaxRebateCalculationRequest {
  taxpayerPan: string;
  applicantType: 'INDIVIDUAL_CAPTAIN' | 'CORPORATE_COMMUTER';
  vehicleVin: string;
  loanSanctionDate: string; // ISO string
  annualLoanInterestPaidPaise: number;
  financialYear: string; // e.g. "2026-2027"
}

export interface TaxRebateCertificateRecord {
  id: string;
  certificateNumber: string;
  taxpayerPan: string;
  applicantType: string;
  vehicleVin: string;
  financialYear: string;
  eligibleDeductionPaise: number; // Max ₹1,50,000 (15000000 paise) under Section 80EEB
  qrVerificationUrl: string;
  issuedAt: string;
}

