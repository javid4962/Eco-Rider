export type OcpiSessionStatus = 'ACTIVE' | 'COMPLETED' | 'PENDING' | 'INVALID';

export interface OcpiSessionStartRequest {
  partnerCpoId: string; // e.g. "IN-TATA-01" or "IN-APEITA-01"
  partnerStationId: string;
  partnerConnectorId: string;
  ecorideVehicleVin: string;
  rfidTokenUid: string;
}

export interface OcpiRoamingSessionRecord {
  id: string;
  ocpiSessionId: string;
  partnerCpoId: string;
  partnerStationId: string;
  ecorideVehicleVin: string;
  totalKwh: number;
  roamingTariffPaisePerKwh: number;
  totalCostPaise: number;
  clearinghouseSettlementId: string;
  status: OcpiSessionStatus;
  startedAt: string;
  completedAt?: string;
}

