export enum LockerCompartmentSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export enum LockerCompartmentStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

export interface SmartLockerCompartmentDto {
  compartmentId: string;
  lockerHubId: string;
  compartmentNumber: string;
  size: LockerCompartmentSize;
  status: LockerCompartmentStatus;
  currentConsignmentId?: string;
  releaseOtpHash?: string;
  expiresAt?: string;
}

export interface DepositParcelDto {
  lockerHubId: string;
  consignmentId: string;
  size: LockerCompartmentSize;
  riderPhone: string;
}

export interface RetrieveParcelDto {
  lockerHubId: string;
  compartmentNumber: string;
  releaseOtp: string;
}

export interface LockerOperationResultDto {
  success: boolean;
  compartmentNumber: string;
  message: string;
  doorUnlocked: boolean;
  timestamp: string;
}
