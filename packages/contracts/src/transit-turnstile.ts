export enum TurnstileStationCode {
  PNBS_VIJAYAWADA = 'PNBS_VIJAYAWADA',
  BZA_RAILWAY_STATION = 'BZA_RAILWAY_STATION',
  GNT_NTR_BUS_TERMINAL = 'GNT_NTR_BUS_TERMINAL',
  AMV_SECRETARIAT_GATE = 'AMV_SECRETARIAT_GATE',
}

export enum TurnstileGateStatus {
  GATE_OPEN = 'GATE_OPEN',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EXPIRED = 'EXPIRED',
  ALREADY_USED = 'ALREADY_USED',
}

export interface GenerateTransitQrRequestDto {
  bookingId: string;
  riderId: string;
  stationCode: TurnstileStationCode;
  corridorCode: string;
}

export interface TransitQrTokenResult {
  token: string;
  qrPayload: string;
  bookingId: string;
  stationCode: TurnstileStationCode;
  expiresAt: string;
}

export interface ValidateTurnstileScanDto {
  qrPayload: string;
  turnstileId: string;
  stationCode: TurnstileStationCode;
  scannedAt: string;
}

export interface TurnstileScanResult {
  turnstileId: string;
  stationCode: TurnstileStationCode;
  gateStatus: TurnstileGateStatus;
  actuatorSignalMs: number;
  riderId?: string;
  message: string;
}
