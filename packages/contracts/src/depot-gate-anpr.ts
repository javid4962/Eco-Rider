export type GateAccessDecision = 'GRANTED' | 'DENIED_PENDING_RECALL' | 'DENIED_BATTERY_FAULT' | 'DENIED_UNREGISTERED';

export interface GateScanRequest {
  depotId: string;
  gateId: string;
  gateType: 'INGRESS' | 'EGRESS';
  scannedPlateNumber: string; // e.g. "AP37EV1234"
  rfidTagId: string;
}

export interface DepotGateAccessRecord {
  id: string;
  depotId: string;
  gateId: string;
  gateType: 'INGRESS' | 'EGRESS';
  plateNumber: string;
  rfidTagId: string;
  decision: GateAccessDecision;
  barrierOpened: boolean;
  reason: string;
  scannedAt: string;
}
