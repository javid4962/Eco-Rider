export enum MaintenanceType {
  ROUTINE_SCHEDULED_SERVICE = 'ROUTINE_SCHEDULED_SERVICE',
  BRAKE_PAD_REPLACEMENT = 'BRAKE_PAD_REPLACEMENT',
  TIRE_ROTATION_ALIGNMENT = 'TIRE_ROTATION_ALIGNMENT',
  SUSPENSION_REGENERATION = 'SUSPENSION_REGENERATION',
  THERMAL_COOLANT_FLUSH = 'THERMAL_COOLANT_FLUSH',
}

export enum WorkOrderStatus {
  SCHEDULED = 'SCHEDULED',
  VEHICLE_AT_DEPOT = 'VEHICLE_AT_DEPOT',
  SERVICING = 'SERVICING',
  COMPLETED = 'COMPLETED',
}

export interface MaintenanceWorkOrderDto {
  id: string;
  orderNumber: string;
  vehicleRegistrationNumber: string;
  serviceType: MaintenanceType;
  depotId: string;
  currentOdometerKm: number;
  triggerReason: string;
  estimatedCostPaise: number;
  actualCostPaise?: number;
  status: WorkOrderStatus;
  scheduledDate: string;
  completedAt?: string;
}

export interface CreateMaintenanceOrderDto {
  vehicleRegistrationNumber: string;
  serviceType: MaintenanceType;
  depotId: string;
  currentOdometerKm: number;
  triggerReason: string;
  scheduledDate: string;
}

