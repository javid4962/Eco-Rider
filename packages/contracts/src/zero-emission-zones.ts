export interface ZeroEmissionZoneDto {
  zoneCode: string;
  zoneName: string;
  municipality: string; // e.g. "APCRDA_AMARAVATHI" or "VMC_VIJAYAWADA"
  activePenaltyPaiseForIce: number; // e.g. 100000 paise (₹1000) statutory penalty
  enforceBevOnly: boolean;
  totalBevCrossingsToday: number;
}

export interface ZezComplianceCheckDto {
  vehicleRegistrationNumber: string;
  isElectric: boolean;
  zoneCode: string;
  enteredAt: string;
}

export interface ZezCertificateDto {
  certificateNumber: string;
  vehicleRegistrationNumber: string;
  zoneCode: string;
  authorizedAccess: boolean;
  penaltyChargedPaise: number;
  issuedAt: string;
}
