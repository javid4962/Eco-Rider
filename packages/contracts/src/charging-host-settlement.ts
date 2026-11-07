export enum ChargingHostSettlementStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  DISBURSED = 'DISBURSED',
  FAILED = 'FAILED',
}

export interface ChargingHostSettlement {
  id: string;
  stationId: string;
  landlordId: string;
  landlordUpiId: string;
  propertyLocation: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalEnergyKwh: number;
  grossRevenuePaise: number;
  electricityCostPaise: number;
  grossMarginPaise: number;
  landlordShareBps: number;
  landlordGrossPayoutPaise: number;
  gstAmountPaise: number;
  tdsDeductionPaise: number;
  netLandlordDisbursalPaise: number;
  platformSharePaise: number;
  status: ChargingHostSettlementStatus;
  disbursedAt?: string;
  createdAt: string;
}

export interface CalculateChargingHostSettlementDto {
  stationId: string;
  landlordId: string;
  landlordUpiId: string;
  propertyLocation: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalEnergyKwh: number;
  grossRevenuePaise: number;
  electricityCostPaise: number;
  landlordShareBps: number;
}

