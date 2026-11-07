export enum DisasterMobilizationStage {
  STANDBY_MONITORING = 'STANDBY_MONITORING',
  ACTIVE_EVACUATION = 'ACTIVE_EVACUATION',
  MEDICAL_SUPPLY_TRANSPORT = 'MEDICAL_SUPPLY_TRANSPORT',
  STAND_DOWN_RECOVERY = 'STAND_DOWN_RECOVERY',
}

export interface MobilizationOrderDto {
  incidentReference: string;
  commandingAgency: 'APSDMA' | 'DISTRICT_COLLECTOR_KRISHNA' | 'DISTRICT_COLLECTOR_GUNTUR';
  targetZones: string[];
  mobilizationStage: DisasterMobilizationStage;
  requisitionFleetTargetCount: number;
}

export interface DisasterMobilizationStatusResult {
  incidentReference: string;
  mobilizationStage: DisasterMobilizationStage;
  civilianBookingPaused: boolean;
  totalRequisitionedVehicles: number;
  evacuatedCitizensCount: number;
  authorizedAt: string;
}
