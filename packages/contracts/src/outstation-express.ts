export interface OutstationRouteDto {
  id: string;
  routeCode: string;
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedTransitMinutes: number;
  baseFarePaise: number;
  tollEstimatePaise: number;
  requiredMinSocPercent: number;
  mandatoryChargingStopName?: string;
  mandatoryChargingStopKm?: number;
  isActive: boolean;
}

export interface OutstationBookingRequestDto {
  riderId?: string;
  routeId: string;
  pickupAddress: string;
  dropoffAddress: string;
  departureTime: string;
  passengerCount: number;
  fastagTollIncluded: boolean;
}

export interface OutstationTripDto {
  bookingId: string;
  routeCode: string;
  originCity: string;
  destinationCity: string;
  totalFarePaise: number;
  tollFeePaise: number;
  formattedTotalFare: string;
  assignedCaptainId?: string;
  assignedVehicleReg?: string;
  plannedChargingStop?: string;
  departureTime: string;
  status: 'REQUESTED' | 'ASSIGNED' | 'EN_ROUTE' | 'COMPLETED' | 'CANCELLED';
}

