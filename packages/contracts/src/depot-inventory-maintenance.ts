export enum SparePartCategory {
  HV_CONTACTOR = 'HV_CONTACTOR',
  PYRO_FUSE = 'PYRO_FUSE',
  REGEN_BRAKE_PAD = 'REGEN_BRAKE_PAD',
  COOLANT_PUMP = 'COOLANT_PUMP',
  BMS_WIRING_HARNESS = 'BMS_WIRING_HARNESS',
}

export enum DepotWorkOrderStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PARTS_SHORTAGE = 'PARTS_SHORTAGE',
}

export interface CreatePreventiveWorkOrderDto {
  depotId: string;
  vehicleId: string;
  partCategory: SparePartCategory;
  odometerKm: number;
  regenCyclesCount: number;
  availableStockUnits: number;
}

export interface DepotMaintenanceWorkOrderResult {
  workOrderId: string;
  vehicleId: string;
  depotId: string;
  partCategory: SparePartCategory;
  status: DepotWorkOrderStatus;
  estimatedLaborMinutes: number;
  partsReservedUnits: number;
  preventiveAlertIssued: boolean;
}
