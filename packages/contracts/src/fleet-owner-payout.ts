export enum FleetLeaseModel {
  FIXED_DAILY_RENTAL = 'FIXED_DAILY_RENTAL', // Captain pays fixed daily amount (e.g. ₹500/day)
  PERCENTAGE_SPLIT = 'PERCENTAGE_SPLIT',     // Gross fare split: e.g. 70% Captain, 20% Owner, 10% Platform
}

export interface FleetLeaseContractDto {
  id: string;
  fleetOwnerId: string;
  fleetOwnerName: string;
  captainId: string;
  captainName: string;
  vehicleId: string;
  vehicleRegistrationNumber: string;
  model: FleetLeaseModel;
  dailyRentPaise?: number;
  ownerSharePercent?: number;
  captainSharePercent?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface FleetOwnerSettlementSummaryDto {
  settlementDate: string;
  fleetOwnerId: string;
  fleetOwnerName: string;
  activeVehiclesCount: number;
  totalTripsCompleted: number;
  grossFaresCollectedPaise: number;
  captainPayoutsPaise: number;
  electricityDeductionsPaise: number;
  maintenanceReservesPaise: number;
  netFleetOwnerEarningsPaise: number;
  formattedNetEarnings: string;
  status: 'PENDING' | 'PROCESSED' | 'DISBURSED';
}

