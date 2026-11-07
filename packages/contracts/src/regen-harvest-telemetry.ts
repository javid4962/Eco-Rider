export enum RegenStatus {
  OPTIMAL = 'OPTIMAL',
  LIMITED_HIGH_SOC = 'LIMITED_HIGH_SOC',
  THERMAL_THROTTLED = 'THERMAL_THROTTLED',
  CUTOFF_FULL_CHARGE = 'CUTOFF_FULL_CHARGE',
}

export interface RegenHarvestLog {
  id: string;
  vehicleId: string;
  tripId?: string;
  corridorSegment: string;
  slopeGradePercent: number;
  descentDistanceMeters: number;
  entrySpeedKmh: number;
  exitSpeedKmh: number;
  regenTorqueNm: number;
  energyRecuperatedWattHours: number;
  packSocPercent: number;
  cellMaxTemperatureC: number;
  regenStatus: RegenStatus;
  createdAt: string;
}

export interface IngestRegenTelemetryDto {
  vehicleId: string;
  tripId?: string;
  corridorSegment: string;
  slopeGradePercent: number;
  descentDistanceMeters: number;
  entrySpeedKmh: number;
  exitSpeedKmh: number;
  packSocPercent: number;
  cellMaxTemperatureC: number;
}
