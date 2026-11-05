/**
 * EcoRide Multi-Modal Feeder & Unified AP Transit Contracts (M30)
 * Feeder links with APSRTC bus terminals, Indian Railway stations
 * (Vijayawada Junction, Guntur Junction), Gannavaram Airport shuttles,
 * and single-ticket QR transit passes.
 */

export enum TransitHubType {
  APSRTC_BUS_STATION = 'APSRTC_BUS_STATION',
  RAILWAY_STATION = 'RAILWAY_STATION',
  AIRPORT = 'AIRPORT',
  METRO_OR_BRTS = 'METRO_OR_BRTS',
}

export interface TransitHubDto {
  id: string;
  name: string;
  hubType: TransitHubType;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  dedicatedEvPickupBay: string;
  isActive: boolean;
}

export interface MultiModalTripBookingDto {
  riderId?: string;
  originAddress: string;
  originLatitude: number;
  originLongitude: number;
  transitHubId: string;
  transitMode: 'APSRTC_EXPRESS' | 'INDIAN_RAILWAYS' | 'AIRPORT_FLIGHT';
  transitScheduleNumber?: string; // e.g. Train #12727 or Bus #APSRTC-998
  transitDepartureTime: string;
  passengerCount: number;
}

export interface MultiModalTicketDto {
  id: string;
  ticketNumber: string;
  bookingId: string;
  transitHubName: string;
  pickupTime: string;
  estimatedArrivalAtHub: string;
  farePaise: number;
  formattedFare: string;
  unifiedQrPayload: string;
  status: 'CONFIRMED' | 'BOARDED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

