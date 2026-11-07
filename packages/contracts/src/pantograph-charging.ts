export type PantographAlignmentStatus = 'ALIGNING' | 'LOCKED_CONTACT' | 'DISENGAGED' | 'FAULT';

export interface PantographChargingSessionRequest {
  busId: string;
  stationId: string;
  chargerBayNumber: number;
  initialSocPct: number;
  targetSocPct: number;
  powerRatingKw: number; // e.g. 350 kW or 450 kW
}

export interface PantographChargingSessionRecord {
  id: string;
  sessionNumber: string;
  busId: string;
  stationId: string;
  chargerBayNumber: number;
  contactPressureNewtons: number; // e.g. 120 N
  alignmentStatus: PantographAlignmentStatus;
  initialSocPct: number;
  finalSocPct: number;
  energyDeliveredKwh: number;
  peakPowerKw: number;
  tariffPaisePerKwh: number;
  totalCostPaise: number;
  startedAt: string;
  completedAt?: string;
}
