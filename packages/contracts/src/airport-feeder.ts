/**
 * M74: Multi-Modal Transit Fare Integration with Gannavaram Airport Flight Feeder Schedules
 * Vijayawada International Airport (VGA) real-time flight tracking & dedicated EV feeder dispatch.
 */

export enum FlightStatus {
  SCHEDULED = 'SCHEDULED',
  ON_TIME = 'ON_TIME',
  DELAYED = 'DELAYED',
  LANDED = 'LANDED',
  CANCELLED = 'CANCELLED',
}

export interface FlightScheduleFeedDto {
  flightNumber: string; // e.g. 6E-7128, AI-542
  airline: string;
  originIata: string; // e.g. HYD, BLR, DEL
  destinationIata: string; // 'VGA'
  scheduledArrivalTime: string; // ISO timestamp
  actualArrivalTime?: string;
  status: FlightStatus;
  delayMinutes: number;
}

export interface AirportFeederBookingDto {
  riderId: string;
  flightNumber: string;
  scheduledArrival: string;
  destinationAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  terminalGate: string; // 'GATE_1', 'GATE_2'
  luggageCount: number;
}

export interface AirportFeederScheduleResult {
  bookingId: string;
  flightNumber: string;
  originalPickupTime: string;
  adjustedPickupTime: string;
  delayAdjustedMinutes: number;
  assignedPickupBay: string; // 'EV_DEDICATED_BAY_04'
  farePaise: number;
  status: 'CONFIRMED' | 'DELAY_ADJUSTED' | 'FLIGHT_CANCELLED_REFUNDED';
}

