export enum LockboxSecurityState {
  SECURE_LOCKED = 'SECURE_LOCKED',
  UNLOCKED_ACCESS = 'UNLOCKED_ACCESS',
  TAMPER_ALARM = 'TAMPER_ALARM',
  DELIVERED_CLEARED = 'DELIVERED_CLEARED',
}

export interface ProvisionLockboxDto {
  consignmentId: string;
  vehicleId: string;
  senderPhone: string;
  receiverPhone: string;
  isHighValuePharma: boolean;
}

export interface LockboxProvisionResult {
  lockboxId: string;
  consignmentId: string;
  vehicleId: string;
  senderDepositOtpHash: string;
  receiverWithdrawalOtp: string;
  securityState: LockboxSecurityState;
  provisionedAt: string;
}

export interface VerifyLockboxOtpDto {
  lockboxId: string;
  otp: string;
  actorRole: 'SENDER' | 'RECEIVER';
}

export interface LockboxAccessResult {
  lockboxId: string;
  securityState: LockboxSecurityState;
  isAccessGranted: boolean;
  message: string;
  timestamp: string;
}
