/**
 * EcoRide Shared-Schedule Corridor & Passenger Pooling Contracts (EV-083 – EV-097)
 * High-occupancy electric corridor transit in Andhra Pradesh (Vijayawada – Guntur – Amaravathi),
 * ordered virtual stops, segment-based seat allocation, and manifest contracts.
 */

export enum CorridorTripStatus {
  SCHEDULED = 'SCHEDULED',
  BOARDING = 'BOARDING',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CorridorReservationStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  CHECKED_IN = 'CHECKED_IN',
  NO_SHOW = 'NO_SHOW',
}

export interface CorridorVirtualStop {
  stopId: string;
  name: string;
  sequenceNumber: number; // 1-indexed
  latitude: number;
  longitude: number;
  city: string;
  landmark?: string;
}

export interface CorridorRouteDto {
  id: string;
  code: string; // e.g. 'CORR-AP-VJA-GNT'
  name: string;
  originCity: string;
  destinationCity: string;
  stops: CorridorVirtualStop[];
  totalDistanceMeters: number;
  isActive: boolean;
}

export interface CreateCorridorRouteDto {
  code: string;
  name: string;
  originCity: string;
  destinationCity: string;
  stops: CorridorVirtualStop[];
  totalDistanceMeters: number;
}

export interface CorridorScheduleDto {
  id: string;
  routeId: string;
  departureTime: string; // 'HH:MM' e.g. '08:30'
  daysOfWeek: number[]; // 1 = Monday, 7 = Sunday
  totalSeats: number;
  baseSegmentFarePaise: number;
  isActive: boolean;
}

export interface CreateCorridorScheduleDto {
  routeId: string;
  departureTime: string;
  daysOfWeek: number[];
  totalSeats: number;
  baseSegmentFarePaise: number;
}

export interface CorridorTripDto {
  id: string;
  scheduleId: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  tripDate: string; // 'YYYY-MM-DD'
  departureTime: string;
  totalSeats: number;
  status: CorridorTripStatus;
  vehicleId?: string | null;
  captainId?: string | null;
  availableSeatsCount: number;
}

export interface BookCorridorSeatDto {
  tripId: string;
  fromStopSequence: number;
  toStopSequence: number;
  seatCount: number;
  riderId?: string;
  idempotencyKey?: string;
}

export interface CorridorSeatReservationDto {
  reservationId: string;
  tripId: string;
  bookingCode: string;
  riderId: string;
  seatNumbers: number[];
  fromStopSequence: number;
  fromStopName: string;
  toStopSequence: number;
  toStopName: string;
  farePaise: number;
  formattedFare: string;
  boardingPassCode: string;
  status: CorridorReservationStatus;
  checkedIn: boolean;
  createdAt: string;
}

export interface TripManifestEntryDto {
  reservationId: string;
  seatNumber: number;
  riderId: string;
  fromStopSequence: number;
  fromStopName: string;
  toStopSequence: number;
  toStopName: string;
  boardingPassCode: string;
  checkedIn: boolean;
  checkedInAt?: string | null;
}

export interface TripManifestDto {
  tripId: string;
  routeCode: string;
  routeName: string;
  tripDate: string;
  departureTime: string;
  vehicleRegistration?: string | null;
  captainName?: string | null;
  totalSeats: number;
  bookedSeatsCount: number;
  entries: TripManifestEntryDto[];
}

