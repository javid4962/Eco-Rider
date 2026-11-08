export enum IntercityRoute {
  AMARAVATHI_VIJAYAWADA_EXPRESS = 'AMARAVATHI_VIJAYAWADA_EXPRESS',
  VIJAYAWADA_GUNTUR_NONSTOP = 'VIJAYAWADA_GUNTUR_NONSTOP',
  GUNTUR_TENALI_CONNECTOR = 'GUNTUR_TENALI_CONNECTOR',
}

export enum IntercitySeatStatus {
  CONFIRMED = 'CONFIRMED',
  BOARDED = 'BOARDED',
  CANCELLED_REFUNDED = 'CANCELLED_REFUNDED',
}

export interface ReserveIntercitySeatDto {
  passengerId: string;
  route: IntercityRoute;
  departureTime: string;
  requestedSeatNumber: number;
  maxCoachCapacity: number;
  baseFarePaise: number;
}

export interface IntercitySeatReservationResult {
  reservationId: string;
  passengerId: string;
  route: IntercityRoute;
  seatNumber: number;
  farePaidPaise: number;
  gstPaise: number; // 5% SAC 996412
  status: IntercitySeatStatus;
  qrBoardingPassPayload: string;
  reservedAt: Date;
}
