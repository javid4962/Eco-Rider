/**
 * M82: Inter-State & Cross-District Commercial Freight E-Way Bill Verification
 * Automated verification and checkpost clearance with AP Commercial Taxes Department.
 */

export enum EwayBillStatus {
  VALID = 'VALID',
  EXPIRED = 'EXPIRED',
  OVERWEIGHT_REJECTED = 'OVERWEIGHT_REJECTED',
  CLEARED_AT_CHECKPOST = 'CLEARED_AT_CHECKPOST',
}

export interface EwayBillVerificationDto {
  ewayBillNumber: string; // 12-digit statutory e-way bill number
  vehicleRegistrationNumber: string; // e.g. AP 16 EV 9090
  consignorGstin: string; // AP state code 37...
  consigneeGstin: string;
  grossWeightKg: number;
  vehicleMaxGvwKg: number;
  checkpostName: string; // e.g. 'Garikapadu Border Checkpost', 'Pottipadu Toll'
  declaredGoodsValuePaise: number;
  validUntil: string;
}

export interface EwayBillClearanceResult {
  ewayBillNumber: string;
  status: EwayBillStatus;
  isCleared: boolean;
  clearanceReference: string;
  weightMarginKg: number;
  statutoryGstVerified: boolean;
  clearanceTimestamp: string;
  message: string;
}

