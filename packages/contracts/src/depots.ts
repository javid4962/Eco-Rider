/**
 * EcoRide Institutional & Municipal Fleet Depots Contracts (M29)
 * Government & institutional parking & overnight charging depots
 * in the AP Capital Region (Velagapudi, Nelapadu, Mangalagiri AIIMS, PNBS).
 */

export interface FleetDepotDto {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  totalParkingBays: number;
  availableParkingBays: number;
  totalChargingGuns: number;
  availableChargingGuns: number;
  isGovernmentAuthorized: boolean;
  securityContact: string;
  isActive: boolean;
}

export interface DepotBayAllocationDto {
  id: string;
  depotId: string;
  depotName: string;
  vehicleId: string;
  vehiclePlate: string;
  bayNumber: string;
  allocatedFrom: string;
  allocatedUntil: string;
  purpose: 'OVERNIGHT_PARKING' | 'CHARGING' | 'MAINTENANCE_INSPECTION';
  status: 'ACTIVE' | 'RELEASED' | 'EXPIRED';
}

export interface AllocateBayRequestDto {
  depotId: string;
  vehicleId: string;
  purpose: 'OVERNIGHT_PARKING' | 'CHARGING' | 'MAINTENANCE_INSPECTION';
  hoursDuration: number;
}

