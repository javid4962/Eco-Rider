export enum AgriProduceType {
  GUNTUR_CHILLI = 'GUNTUR_CHILLI',
  KRISHNA_MANGO = 'KRISHNA_MANGO',
  COTTON = 'COTTON',
  TURMERIC = 'TURMERIC',
  ORGANIC_VEGETABLES = 'ORGANIC_VEGETABLES',
}

export enum AgriConsignmentStatus {
  AGGREGATING = 'AGGREGATING',
  WEIGHED = 'WEIGHED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED_MARKFED = 'DELIVERED_MARKFED',
  SETTLED = 'SETTLED',
}

export interface AgriProduceConsignment {
  id: string;
  consignmentCode: string;
  farmerId: string;
  farmerName: string;
  farmerAadhaarMasked: string;
  farmerUpiId: string;
  mandal: string;
  district: string;
  produceType: AgriProduceType;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  ratePerKgPaise: number;
  grossProduceValuePaise: number;
  apmcCessRateBps: number;
  apmcCessAmountPaise: number;
  logisticsFeePaise: number;
  netFarmerPayoutPaise: number;
  evCargoVehicleId: string;
  captainId: string;
  markfedHubId: string;
  status: AgriConsignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgriConsignmentDto {
  farmerId: string;
  farmerName: string;
  farmerAadhaarMasked: string;
  farmerUpiId: string;
  mandal: string;
  district: string;
  produceType: AgriProduceType;
  grossWeightKg: number;
  tareWeightKg: number;
  ratePerKgPaise: number;
  evCargoVehicleId: string;
  captainId: string;
  markfedHubId: string;
}

