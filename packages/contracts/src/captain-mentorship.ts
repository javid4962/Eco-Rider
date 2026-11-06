/**
 * M71: Multi-Tier Captain Loyalty Guilds & Peer Mentorship Incentive Pool
 * Standard contracts for senior captain mentorship pairings and milestone bonuses in AP.
 */

export enum MentorshipStatus {
  ASSIGNED = 'ASSIGNED',
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  REVOKED = 'REVOKED',
}

export interface CaptainMentorshipPairing {
  id: string;
  mentorCaptainId: string;
  mentorTier: 'GOLD' | 'PLATINUM';
  menteeCaptainId: string;
  status: MentorshipStatus;
  targetTrips: number;
  completedTrips: number;
  minimumRating: number;
  currentRating: number;
  bonusAmountPaise: number; // e.g., 250000 paise (₹2,500)
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMentorshipPairingDto {
  mentorCaptainId: string;
  mentorTier: 'GOLD' | 'PLATINUM';
  menteeCaptainId: string;
  targetTrips?: number;
  minimumRating?: number;
  bonusAmountPaise?: number;
}

export interface UpdateMentorshipProgressDto {
  tripsIncrement?: number;
  newRating?: number;
}

export interface MentorshipGraduationResult {
  pairingId: string;
  status: MentorshipStatus;
  isGraduated: boolean;
  bonusDisbursedPaise: number;
  ledgerTransactionId?: string;
  message: string;
}

