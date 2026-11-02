/**
 * EcoRide Fleet Organizations, Membership, Driver Assignment & Shifts (EV-030)
 *
 * Scoped governance for commercial EV fleet partners.
 * Enforces strict cross-fleet tenant isolation, assignment audit history,
 * shift telemetry records, and organizational financial segregation.
 */

export enum FleetOrganizationStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export enum FleetAssignmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED',
}

export enum FleetShiftType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  NIGHT = 'NIGHT',
  CUSTOM = 'CUSTOM',
}

export enum FleetShiftStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface FleetOrganizationDto {
  id: string;
  name: string;
  businessRegistrationNumber: string;
  ownerId: string;
  city: string;
  contactPhone: string;
  contactEmail?: string | null;
  payoutAccountId: string;
  status: FleetOrganizationStatus | string;
  totalVehicles?: number;
  activeDrivers?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFleetOrganizationRequest {
  name: string;
  businessRegistrationNumber: string;
  city?: string;
  contactPhone: string;
  contactEmail?: string;
  payoutAccountId: string;
}

export interface FleetVehicleDto {
  id: string;
  fleetOrganizationId: string;
  registrationNumber: string;
  propulsionType: string;
  vehicleCategory: string;
  serviceClass: string;
  seatingConfiguration: string;
  make: string;
  model: string;
  yearOfManufacture: number;
  currentSocPercent: number;
  ratedRangeKm: number;
  isRoadworthy: boolean;
  assignedDriverId?: string | null;
  assignedDriverName?: string | null;
  assignedDriverPhone?: string | null;
  currentShiftId?: string | null;
  city: string;
  createdAt: string;
}

export interface AssignFleetDriverRequest {
  driverUserId: string;
  assignmentReason?: string;
  notes?: string;
}

export interface FleetVehicleAssignmentDto {
  id: string;
  fleetOrganizationId: string;
  vehicleId: string;
  vehicleRegistrationNumber?: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  assignedById: string;
  assignedByName?: string;
  assignedAt: string;
  unassignedAt?: string | null;
  status: FleetAssignmentStatus | string;
  assignmentReason: string;
  notes?: string | null;
  createdAt: string;
}

export interface StartFleetShiftRequest {
  vehicleId: string;
  driverUserId: string;
  shiftType?: FleetShiftType;
  startOdometerKm?: number;
  startSocPercent?: number;
}

export interface EndFleetShiftRequest {
  endOdometerKm: number;
  endSocPercent: number;
  totalTrips?: number;
  totalEarningsPaise?: number;
}

export interface FleetShiftDto {
  id: string;
  fleetOrganizationId: string;
  vehicleId: string;
  vehicleRegistrationNumber?: string;
  driverId: string;
  driverName?: string;
  shiftType: FleetShiftType | string;
  startTime: string;
  endTime?: string | null;
  startSocPercent: number;
  endSocPercent?: number | null;
  startOdometerKm: number;
  endOdometerKm?: number | null;
  totalTrips: number;
  totalEarningsPaise: number;
  status: FleetShiftStatus | string;
  createdAt: string;
}

export interface FleetEarningsLedgerItem {
  id: string;
  idempotencyKey: string;
  bookingId?: string | null;
  entryType: 'DEBIT' | 'CREDIT';
  amountPaise: number;
  amountInr: number;
  currency: string;
  description?: string | null;
  createdAt: string;
}

export interface FleetEarningsSummaryDto {
  fleetOrganizationId: string;
  fleetName: string;
  payoutAccountId: string;
  currency: string;
  totalGrossPaise: number;
  totalGrossInr: number;
  platformFeePaise: number;
  platformFeeInr: number;
  netFleetEarningsPaise: number;
  netFleetEarningsInr: number;
  totalShiftsCompleted: number;
  totalTripsCount: number;
  activeVehiclesCount: number;
  recentTransactions: FleetEarningsLedgerItem[];
}

