export interface DeliveryStopNode {
  stopId: string;
  recipientName: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  parcelWeightKg: number;
  priority: 'HIGH' | 'STANDARD';
}

export interface EnergyOptimalTspRequest {
  vehicleId: string;
  startDepotId: string;
  startLatitude: number;
  startLongitude: number;
  stops: DeliveryStopNode[];
}

export interface EnergyOptimalTspRouteResult {
  id: string;
  routeId: string;
  vehicleId: string;
  orderedStopIds: string[];
  totalDistanceKm: number;
  estimatedEnergyKwh: number;
  elevationAvoidedGainMeters: number;
  optimizedAt: string;
}

