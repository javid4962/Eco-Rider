export enum HighwaySlotStatus {
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  COMPLETED = 'COMPLETED',
  NO_SHOW_CANCELLED = 'NO_SHOW_CANCELLED',
}

export interface HighwayChargingReservationDto {
  reservationId: string;
  vehicleRegistrationNumber: string;
  highwayPlazaId: string;
  highwayName: string; // e.g. NH-16
  bayNumber: string;
  targetArrivalWindowStart: string;
  targetArrivalWindowEnd: string;
  depositPaise: number;
  status: HighwaySlotStatus;
  reservedAt: string;
}

export interface ReserveHighwaySlotDto {
  vehicleRegistrationNumber: string;
  highwayPlazaId: string;
  highwayName: string;
  targetArrivalWindowStart: string;
  targetArrivalWindowEnd: string;
}
