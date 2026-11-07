export enum GreenBondAuditStatus {
  DRAFT = 'DRAFT',
  CAG_AUDITED = 'CAG_AUDITED',
  SEBI_ESG_VERIFIED = 'SEBI_ESG_VERIFIED',
  PUBLISHED = 'PUBLISHED',
}

export interface GreenBondAuditReport {
  id: string;
  reportingPeriod: string;
  bondSeriesId: string;
  totalCleanKmTraveled: number;
  totalKwhConsumed: number;
  solarWindSharePercent: number;
  displacedDieselLiters: number;
  avoidedCo2EmissionsMetricTons: number;
  greenJobsGeneratedCount: number;
  capitalExpenditurePaise: number;
  bondProceedsAllocatedPaise: number;
  complianceRatioBps: number;
  tamperProofCertificateSha256: string;
  status: GreenBondAuditStatus;
  auditedAt: string;
}

export interface GenerateGreenBondReportDto {
  reportingPeriod: string;
  bondSeriesId: string;
  totalCleanKmTraveled: number;
  totalKwhConsumed: number;
  solarWindSharePercent: number;
  capitalExpenditurePaise: number;
  bondProceedsAllocatedPaise: number;
  greenJobsGeneratedCount: number;
}

