/**
 * EcoRide Automated Driver Incentives & Gamification Contracts (M28)
 * Captain tier progression, peak hour surge bonus milestones,
 * and zero-cancellation daily rewards.
 */

export enum CaptainTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export interface CaptainTierDto {
  captainId: string;
  tier: CaptainTier;
  weeklyCompletedTrips: number;
  acceptanceRatePercent: number;
  cancellationRatePercent: number;
  customerRating: number;
  commissionDiscountBps: number; // e.g. 200 bps = 2% discount on platform fee
  perTripBonusPaise: number;     // e.g. 1000 paise = ₹10/trip bonus for Platinum
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface IncentiveChallengeDto {
  id: string;
  title: string;
  description: string;
  targetTrips: number;
  rewardPaise: number;
  formattedReward: string;
  applicableShift: string; // e.g. 'PEAK_MORNING', 'PEAK_EVENING', 'DAILY_ALL'
  city: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CaptainChallengeProgressDto {
  challengeId: string;
  title: string;
  targetTrips: number;
  completedTrips: number;
  isUnlocked: boolean;
  rewardPaise: number;
  formattedReward: string;
}

export interface AwardIncentiveResultDto {
  captainId: string;
  challengeId: string;
  rewardPaise: number;
  ledgerTransactionId: string;
  awardedAt: string;
}

