export enum CanopyChargingBayType {
  DC_FAST_60KW = 'DC_FAST_60KW',
  DC_ULTRA_FAST_120KW = 'DC_ULTRA_FAST_120KW',
  SOLAR_BUFFERED_AC_22KW = 'SOLAR_BUFFERED_AC_22KW',
}

export enum CanopyReservationStatus {
  RESERVED = 'RESERVED',
  PLUGGED_IN = 'PLUGGED_IN',
  NO_SHOW_CANCELLED = 'NO_SHOW_CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface ReserveCanopySlotDto {
  depotId: string;
  bayType: CanopyChargingBayType;
  captainId: string;
  vehicleId: string;
  slotStartTime: string;
  durationMinutes: number;
}

export interface CanopySlotReservationResult {
  reservationId: string;
  depotId: string;
  bayType: CanopyChargingBayType;
  bayNumber: string;
  captainId: string;
  depositFeePaise: number;
  status: CanopyReservationStatus;
  slotStartTime: string;
  slotEndTime: string;
  plugInGracePeriodMinutes: number;
}

export interface CheckInCanopySessionDto {
  reservationId: string;
  vehicleId: string;
  currentSoC: number;
}

