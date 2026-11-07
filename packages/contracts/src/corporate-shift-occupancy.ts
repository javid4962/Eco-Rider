export type PassengerBoardingStatus = 'BOARDED' | 'ABSENT' | 'CANCELLED';

export interface ManifestEmployeeItem {
  employeeId: string;
  name: string;
  stopSequence: number;
  stopName: string;
  status: PassengerBoardingStatus;
  boardedAt?: string;
}

export interface ReconcileManifestRequest {
  manifestId: string;
  routeId: string;
  vehicleCapacity: number;
  actualBoardings: Array<{
    employeeId: string;
    boardedAt: string;
  }>;
}

export interface RouteOccupancySummary {
  manifestId: string;
  routeId: string;
  totalScheduled: number;
  totalBoarded: number;
  totalAbsent: number;
  vehicleCapacity: number;
  occupancyRatePct: number;
  skippedStopsCount: number;
  reconciledAt: string;
}

