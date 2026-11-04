export interface AadhaarVerifyRequest {
  aadhaarNumber: string;
  otp?: string;
  transactionId?: string;
}

export interface AadhaarVerifyResult {
  verified: boolean;
  maskedAadhaar: string; // e.g. "XXXXXXXX1234"
  nameMatches?: boolean;
  gender?: string;
  yearOfBirth?: number;
  state?: string;
  isAdult: boolean;
  referenceId: string;
  rejectionReason?: string;
}

export interface DrivingLicenseVerifyRequest {
  dlNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
}

export interface DrivingLicenseVerifyResult {
  verified: boolean;
  dlNumber: string;
  holderName?: string;
  validUntil?: string;
  vehicleClasses: string[]; // e.g. ['MCWG', 'LMV-TR', 'TRANS']
  isCommercialPermitted: boolean;
  isExpired: boolean;
  referenceId: string;
  rejectionReason?: string;
}

export interface VehicleRcVerifyRequest {
  registrationNumber: string; // e.g. 'AP-31-EV-1001'
  chassisNumber?: string;
}

export interface VehicleRcVerifyResult {
  verified: boolean;
  registrationNumber: string;
  fuelType: 'ELECTRIC' | 'PETROL' | 'DIESEL' | 'CNG' | 'HYBRID';
  isElectric: boolean;
  vehicleClass: string; // e.g. '3W-COMMERCIAL', '4W-CAB'
  registrationState: string; // e.g. 'AP'
  fitnessValidUntil?: string;
  insuranceValidUntil?: string;
  referenceId: string;
  rejectionReason?: string;
}

export interface IKycProvider {
  verifyAadhaar(request: AadhaarVerifyRequest): Promise<AadhaarVerifyResult>;
  verifyDrivingLicense(request: DrivingLicenseVerifyRequest): Promise<DrivingLicenseVerifyResult>;
  verifyRc(request: VehicleRcVerifyRequest): Promise<VehicleRcVerifyResult>;
}

