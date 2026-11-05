export enum FreightManifestStatus {
  PLANNED = 'PLANNED',
  LOADING = 'LOADING',
  IN_TRANSIT = 'IN_TRANSIT',
  UNLOADING = 'UNLOADING',
  COMPLETED = 'COMPLETED',
}

export interface ConsignmentItemDto {
  consignmentNumber: string;
  senderName: string;
  receiverName: string;
  weightKg: number;
  volumeCubicFeet: number;
  declaredValuePaise: number;
  destinationHubId: string;
}

export interface FreightManifestDto {
  id: string;
  manifestNumber: string;
  originHubCode: string;
  destinationHubCode: string;
  vehicleRegistrationNumber: string;
  captainId: string;
  totalConsignments: number;
  grossWeightKg: number;
  payloadCapacityKg: number;
  volumetricUtilizationPercent: number;
  status: FreightManifestStatus;
  weighbridgeTareWeightKg?: number;
  weighbridgeGrossWeightKg?: number;
  dispatchTime?: string;
  arrivalTime?: string;
}

export interface CreateFreightManifestDto {
  originHubCode: string;
  destinationHubCode: string;
  vehicleRegistrationNumber: string;
  captainId: string;
  consignments: ConsignmentItemDto[];
  payloadCapacityKg: number;
}

