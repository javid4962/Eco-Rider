export enum BessRepurposingStatus {
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  APPROVED_FOR_DEPOT_STORAGE = 'APPROVED_FOR_DEPOT_STORAGE',
  RECYCLED = 'RECYCLED',
}

export interface BatteryDegradationDto {
  id: string;
  batteryPackSerial: string;
  vehicleRegistrationNumber: string;
  initialCapacityKwh: number;
  currentCapacityKwh: number;
  stateOfHealthPercent: number;
  cycleCount: number;
  projectedRemainingUsefulLifeMonths: number;
  secondLifeRecommended: boolean;
  evaluatedAt: string;
}

export interface BessRepurposingOrderDto {
  id: string;
  orderNumber: string;
  batteryPackSerial: string;
  designatedDepotId: string;
  intendedUse: string; // e.g. "Overnight Grid Solar Buffer"
  status: BessRepurposingStatus;
  approvedAt?: string;
  createdAt: string;
}

export interface EvaluateDegradationRequestDto {
  batteryPackSerial: string;
  vehicleRegistrationNumber: string;
  initialCapacityKwh: number;
  currentCapacityKwh: number;
  cycleCount: number;
  averageOperatingTempCelsius: number;
}

