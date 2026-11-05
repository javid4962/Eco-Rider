/**
 * EcoRide Communications & Loyalty Engine Contracts (M21)
 * Referral bonuses, promo discount vouchers, loyalty tiers,
 * and double-entry promotional wallet credits.
 */

export enum PromoDiscountType {
  FLAT_DISCOUNT = 'FLAT_DISCOUNT',         // Fixed paise discount
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT', // Percentage with max paise cap
}

export enum PromoApplicableService {
  ALL = 'ALL',
  PASSENGER_RIDE = 'PASSENGER_RIDE',
  CORRIDOR_POOLING = 'CORRIDOR_POOLING',
  CARGO_DELIVERY = 'CARGO_DELIVERY',
  COMMUTER_PASS = 'COMMUTER_PASS',
}

export interface PromoCodeDto {
  id: string;
  code: string;
  discountType: PromoDiscountType;
  discountValue: number; // Flat paise or percentage (e.g. 20 for 20%)
  maxDiscountPaise: number;
  minFarePaise: number;
  applicableService: PromoApplicableService;
  usageLimitPerUser: number;
  totalUsageLimit: number;
  currentUsageCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface CreatePromoCodeDto {
  code: string;
  discountType: PromoDiscountType;
  discountValue: number;
  maxDiscountPaise?: number;
  minFarePaise?: number;
  applicableService?: PromoApplicableService;
  usageLimitPerUser?: number;
  totalUsageLimit?: number;
  validFrom: string;
  validUntil: string;
}

export interface ValidatePromoCodeDto {
  code: string;
  farePaise: number;
  serviceCategory?: string;
}

export interface PromoDiscountResult {
  code: string;
  originalFarePaise: number;
  discountPaise: number;
  finalFarePaise: number;
  formattedDiscount: string;
  formattedFinalFare: string;
  isValid: boolean;
  rejectionReason?: string;
}

export interface ReferralProgramDto {
  referrerBonusPaise: number; // e.g. ₹50.00 = 5000 paise
  refereeBonusPaise: number;  // e.g. ₹25.00 = 2500 paise
  minFirstRideFarePaise: number; // e.g. ₹100.00 = 10000 paise
  isActive: boolean;
}

export interface ReferralCodeDto {
  referralCode: string;
  userId: string;
  totalInvited: number;
  totalCompleted: number;
  totalEarnedPaise: number;
  formattedTotalEarned: string;
}

export interface ApplyReferralDto {
  referralCode: string;
}

export interface ReferralRewardResult {
  success: boolean;
  referrerId: string;
  refereeId: string;
  referrerRewardPaise: number;
  refereeRewardPaise: number;
  message: string;
}

