/**
 * EcoRide Corporate & Employee Transport Contracts (EV-110 – EV-112)
 * B2B employer accounts, employee rostering, shift pickup/drop manifests,
 * attendance check-in, and monthly consolidated GST billing.
 */

export enum CorporateAccountStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum WorkShiftType {
  GENERAL_MORNING = 'GENERAL_MORNING', // 09:00 - 18:00
  EVENING_SHIFT = 'EVENING_SHIFT',     // 14:00 - 22:00
  NIGHT_SHIFT = 'NIGHT_SHIFT',         // 22:00 - 06:00
}

export enum CorporateAttendanceStatus {
  SCHEDULED = 'SCHEDULED',
  BOARDED = 'BOARDED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

export interface CorporateAccountDto {
  id: string;
  companyName: string;
  cinOrRegistration: string;
  gstin: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  monthlyCreditLimitPaise: number;
  currentOutstandingPaise: number;
  status: CorporateAccountStatus;
  createdAt: string;
}

export interface CreateCorporateAccountDto {
  companyName: string;
  cinOrRegistration: string;
  gstin: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  monthlyCreditLimitPaise: number;
}

export interface CorporateEmployeeDto {
  id: string;
  corporateAccountId: string;
  employeeCode: string;
  fullName: string;
  phone: string;
  department?: string;
  workShift: WorkShiftType;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  isActive: boolean;
}

export interface RegisterCorporateEmployeeDto {
  corporateAccountId: string;
  employeeCode: string;
  fullName: string;
  phone: string;
  department?: string;
  workShift: WorkShiftType;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
}

export interface ShiftManifestEmployeeEntryDto {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  phone: string;
  pickupAddress: string;
  pickupSequence: number;
  boardingOtp: string;
  status: CorporateAttendanceStatus;
  boardedAt?: string | null;
}

export interface CorporateShiftManifestDto {
  id: string;
  corporateAccountId: string;
  companyName: string;
  manifestDate: string; // 'YYYY-MM-DD'
  shiftType: WorkShiftType;
  assignedVehicleId?: string | null;
  assignedCaptainId?: string | null;
  totalEmployees: number;
  boardedCount: number;
  employees: ShiftManifestEmployeeEntryDto[];
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface CreateShiftManifestDto {
  corporateAccountId: string;
  manifestDate: string;
  shiftType: WorkShiftType;
  employeeIds: string[];
  vehicleId?: string;
  captainId?: string;
}

export interface CorporateMonthlyInvoiceDto {
  invoiceNumber: string;
  corporateAccountId: string;
  companyName: string;
  corporateGstin: string;
  billingMonth: string; // 'YYYY-MM'
  totalTripsCompleted: number;
  baseAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  totalTaxPaise: number;
  totalAmountPaise: number;
  formattedTotal: string;
  dueDate: string;
}

