/**
 * Server-side versioned fare rule and quote contracts for EcoRide.
 * Enforces integer paise monetary representations, regulatory AP tax rates,
 * and immutable pricing snapshots.
 */

export type FareRuleStatus =
  'DRAFT' | 'APPROVED' | 'ACTIVE' | 'SUPERSEDED' | 'REJECTED' | 'ARCHIVED';

export interface FarePromotionConfig {
  promoCode: string;
  discountPercent: number; // e.g., 10 = 10%
  maxDiscountPaise: number; // e.g., 2000 = ₹20 max
  minTripFarePaise?: number; // e.g., 3000 = min fare of ₹30 to apply
  validFrom: string; // ISO-8601 UTC
  validTo: string; // ISO-8601 UTC
}

export interface FareRule {
  id: string;
  ruleCode: string;
  version: number;
  city: string;
  serviceCategory: string;
  status: FareRuleStatus;
  baseFarePaise: number;
  baseDistanceMeters: number;
  perKmRatePaise: number;
  perMinuteRatePaise: number;
  waitingChargePaisePerMinute: number;
  minimumFarePaise: number;
  surgeMultiplier: number;
  taxRateBps: number; // Basis points (500 = 5.00% GST)
  commissionRateBps: number; // Basis points (1500 = 15.00% Platform)
  promotions?: FarePromotionConfig[] | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isIllustrative: boolean; // True for PDF sample rules; cannot be live defaults
  createdById?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  evidenceReference?: string | null; // Statutory gazette order reference
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFareRuleRequest {
  ruleCode: string;
  city: string;
  serviceCategory: string;
  baseFarePaise: number;
  baseDistanceMeters?: number;
  perKmRatePaise: number;
  perMinuteRatePaise?: number;
  waitingChargePaisePerMinute?: number;
  minimumFarePaise?: number;
  surgeMultiplier?: number;
  taxRateBps?: number;
  commissionRateBps?: number;
  promotions?: FarePromotionConfig[];
  effectiveFrom: string;
  effectiveTo?: string;
  isIllustrative?: boolean;
  notes?: string;
}

export interface ApproveFareRuleRequest {
  evidenceReference: string; // Mandatory statutory reference (e.g. AP-STA-2026-GO-42)
  notes?: string;
}

export interface RejectFareRuleRequest {
  rejectionReason: string;
}

export interface TaxBreakdown {
  cgstPaise: number; // Central GST (2.5%)
  sgstPaise: number; // State GST - AP (2.5%)
  totalTaxPaise: number;
}

export interface FareCalculationBreakdown {
  baseFarePaise: number;
  distanceFarePaise: number;
  timeFarePaise: number;
  waitingFarePaise: number;
  subtotalPaise: number;
  surgeMultiplier: number;
  surgedSubtotalPaise: number;
  taxPaise: number;
  taxes: TaxBreakdown;
  discountPaise: number;
  totalPaise: number;
  currency: 'INR';
  formattedRupees: string;
}

export interface StoredRideQuote {
  id: string;
  riderId?: string | null;
  city: string;
  serviceCategory: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  distanceMeters: number;
  durationMinutes: number;
  waitingMinutes: number;
  fareRuleId: string;
  fareRuleVersion: number;
  fareBreakdown: FareCalculationBreakdown;
  totalFarePaise: number;
  appliedPromoCode?: string | null;
  currency: 'INR';
  propulsion: 'BATTERY_ELECTRIC';
  expiresAt: string;
  createdAt: string;
}
