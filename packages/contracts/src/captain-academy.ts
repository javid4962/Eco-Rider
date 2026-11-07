/**
 * M83: Captain Skill Certification & Defensive EV Eco-Driving Academy Verification
 * Specialized training for regenerative braking, efficiency, and passenger safety in AP.
 */

export enum AcademyCourseType {
  EV_REGENERATIVE_EFFICIENCY = 'EV_REGENERATIVE_EFFICIENCY',
  DEFENSIVE_HIGHWAY_DRIVING = 'DEFENSIVE_HIGHWAY_DRIVING',
  COMMUTER_HOSPITALITY_TELUGU = 'COMMUTER_HOSPITALITY_TELUGU',
  EMERGENCY_FIRST_AID_SOS = 'EMERGENCY_FIRST_AID_SOS',
}

export interface CaptainCertificationDto {
  captainId: string;
  courseType: AcademyCourseType;
  examScorePercent: number; // minimum 80% to pass
  ecoDrivingEfficiencyKwhPer100Km: number; // lower is better
  completionDate: string;
}

export interface CaptainAcademyBadgeResult {
  certificateId: string;
  captainId: string;
  courseType: AcademyCourseType;
  passed: boolean;
  awardedBadge: string; // e.g. 'MASTER_ECO_PILOT_2026'
  platformCommissionDiscountBps: number; // up to 200 bps (2%)
  expiryDate: string;
  verificationUrl: string;
}

