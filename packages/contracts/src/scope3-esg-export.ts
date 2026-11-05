export interface Scope3AuditReportDto {
  reportId: string;
  corporateAccountId: string;
  companyName: string;
  reportingPeriod: string; // e.g. "2026-Q3"
  totalElectricTrips: number;
  totalPassengerKm: number;
  baselineIceEmissionsKgCo2e: number;
  evEmissionsKgCo2e: number; // 0 direct tailpipe
  netScope3EmissionsAvoidedKgCo2e: number;
  dieselDisplacedLiters: number;
  petrolDisplacedLiters: number;
  iso14064CompliantHash: string;
  generatedAt: string;
}

export interface GenerateScope3ReportDto {
  corporateAccountId: string;
  reportingPeriod: string;
}

