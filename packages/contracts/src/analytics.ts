/**
 * EcoRide Server-Derived Business Analytics & Reporting Contracts (M22)
 * High-precision KPIs in integer paise, statutory AP GST tax summaries,
 * fleet utilization, EV energy consumption, and demand heatmaps.
 */

export interface PlatformKpisDto {
  period: string; // e.g. '2026-11' or '2026-11-05'
  city?: string;
  totalCompletedRides: number;
  totalPassengerKm: number;
  grossMerchandiseValuePaise: number; // GMV in paise
  formattedGmv: string;
  netPlatformRevenuePaise: number;    // Platform commission in paise
  formattedNetRevenue: string;
  captainEarningsPaise: number;
  formattedCaptainEarnings: string;
  totalEvEnergyConsumedKwh: number;
  co2SavedKg: number;
  activeCaptainsCount: number;
  activeRidersCount: number;
  completionRatePercent: number;
  averageRating: number;
}

export interface GstLineItemDto {
  sacCode: string;
  serviceDescription: string;
  taxableAmountPaise: number;
  cgstRatePercent: number;
  cgstPaise: number;
  sgstRatePercent: number;
  sgstPaise: number;
  totalTaxPaise: number;
}

export interface MonthlyGstReportDto {
  month: string; // YYYY-MM
  stateCode: string; // '37' for Andhra Pradesh
  gstin: string;
  legalEntityName: string;
  lineItems: GstLineItemDto[];
  totalTaxableAmountPaise: number;
  totalCgstPaise: number;
  totalSgstPaise: number;
  totalGstPaise: number;
  formattedTotalGst: string;
}

export interface FleetUtilizationSummaryDto {
  totalVehicles: number;
  activeOnDutyVehicles: number;
  inTripVehicles: number;
  chargingVehicles: number;
  maintenanceVehicles: number;
  fleetUtilizationPercent: number;
  totalDutyHours: number;
  totalTripHours: number;
  totalChargingHours: number;
}

export interface DemandHeatmapPointDto {
  latitude: number;
  longitude: number;
  intensity: number; // 0.0 - 1.0 normalized
  requestCount: number;
  areaName: string;
  city: string;
}

