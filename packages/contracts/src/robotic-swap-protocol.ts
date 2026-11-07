export enum RoboticSwapStep {
  INITIALIZING = 'INITIALIZING',
  ENGAGING = 'ENGAGING',
  UNLOCKING = 'UNLOCKING',
  EXTRACTING = 'EXTRACTING',
  INSERTING = 'INSERTING',
  TORQUE_VERIFYING = 'TORQUE_VERIFYING',
  HANDSHAKE_COMPLETED = 'HANDSHAKE_COMPLETED',
  FAULT_ABORTED = 'FAULT_ABORTED',
}

export interface RoboticSwapSession {
  id: string;
  swapStationId: string;
  bayNumber: string;
  vehicleId: string;
  depletedPackSerial: string;
  freshPackSerial: string;
  currentStep: RoboticSwapStep;
  durationSeconds: number;
  torqueNewtonMetersApplied: number;
  lockingPinsEngagedCount: number;
  canbusHandshakeOk: boolean;
  isSuccessful: boolean;
  faultCode?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ExecuteRoboticSwapDto {
  swapStationId: string;
  bayNumber: string;
  vehicleId: string;
  depletedPackSerial: string;
  freshPackSerial: string;
  torqueNewtonMetersApplied: number;
  lockingPinsEngagedCount: number;
  canbusHandshakeOk: boolean;
}
