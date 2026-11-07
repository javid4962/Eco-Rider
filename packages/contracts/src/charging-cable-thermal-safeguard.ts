export type ThermalActionTaken = 'NORMAL' | 'THROTTLE_CURRENT' | 'EMERGENCY_SHUTDOWN';

export interface CableThermalReading {
  chargerBayId: string;
  vehicleId: string;
  cableTemperatureCelsius: number;
  ambientTemperatureCelsius: number;
  currentAmps: number;
  targetAmps: number;
}

export interface CableThermalStatus {
  id: string;
  chargerBayId: string;
  vehicleId: string;
  cableTemperatureCelsius: number;
  ambientTemperatureCelsius: number;
  actionTaken: ThermalActionTaken;
  adjustedAmps: number;
  alertLevel: 'GREEN' | 'YELLOW' | 'CRITICAL';
  recordedAt: string;
}
