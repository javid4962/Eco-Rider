export enum ColdChainTemperatureRange {
  ULTRA_LOW = 'ULTRA_LOW',     // -20°C to -10°C (Vaccines, ice cream)
  CHILLED = 'CHILLED',         // +2°C to +8°C (Dairy, fresh produce, insulins)
  CONTROLLED_ROOM = 'CRT',     // +15°C to +25°C (Standard pharmaceuticals)
}

export interface ColdChainShipmentDto {
  id: string;
  consignmentId: string;
  vehicleRegistrationNumber: string;
  cargoType: string;
  requiredRange: ColdChainTemperatureRange;
  minAllowedTempCelsius: number;
  maxAllowedTempCelsius: number;
  currentTempCelsius: number;
  currentHumidityPercent: number;
  isExcursionDetected: boolean;
  totalExcursionsCount: number;
  lastTelemetryAt: string;
}

export interface ColdChainTelemetryPingDto {
  shipmentId: string;
  reeferUnitId: string;
  sensorTempCelsius: number;
  humidityPercent: number;
  compressorActive: boolean;
  reeferBatterySocPercent: number;
  recordedAt: string;
}

export interface TemperatureExcursionAlertDto {
  id: string;
  shipmentId: string;
  actualTempCelsius: number;
  allowedMaxTempCelsius: number;
  severity: 'WARNING' | 'BREACH';
  timestamp: string;
  remedialAction: string;
}

