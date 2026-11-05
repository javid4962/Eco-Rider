/**
 * EcoRide Carbon Offset & Green Certificates Contracts (M27)
 * Authoritative emission avoidance formulas, verifiable green rider/captain certificates,
 * and corporate ESG compliance reporting for Andhra Pradesh.
 */

export interface CarbonSavingsCalculation {
  distanceKm: number;
  vehicleCategory: string; // 2W, 3W, 4W
  bevEmissionsGramsPerKm: number; // 0 for zero direct tailpipe emission
  iceBaselineGramsPerKm: number;   // e.g. 2W: 45g/km, 3W: 90g/km, 4W: 160g/km
  co2SavedGrams: number;
  co2SavedKg: number;
  treesEquivalent: number;
}

export interface GreenCertificateDto {
  certificateNumber: string;
  recipientName: string;
  recipientType: 'RIDER' | 'CAPTAIN' | 'CORPORATE';
  recipientId: string;
  totalElectricKm: number;
  totalCo2SavedKg: number;
  totalGreenTrips: number;
  issuedAt: string;
  verificationUrl: string;
  badgeLevel: 'SAPLING' | 'ECO_WARRIOR' | 'CARBON_NEUTRAL_CHAMPION' | 'NET_ZERO_HERO';
}

export interface CorporateEsgReportDto {
  corporateAccountId: string;
  companyName: string;
  reportingPeriod: string; // YYYY-MM or YYYY-Q1
  totalTripsCompleted: number;
  totalElectricKm: number;
  totalCo2AvoidedKg: number;
  dieselDisplacedLiters: number;
  petrolDisplacedLiters: number;
  esgCertificateHash: string;
  generatedAt: string;
}

