export enum ReplicationSyncState {
  STREAMING_HEALTHY = 'STREAMING_HEALTHY',
  CATCHING_UP = 'CATCHING_UP',
  STANDALONE_FAILOVER_PROMOTED = 'STANDALONE_FAILOVER_PROMOTED',
}

export interface ReplicaSyncStatusDto {
  primaryNodeId: string;
  standbyNodeId: string;
  regionalDataCenter: string; // e.g. "AP-CENTRAL-VIJAYAWADA" to "AP-EAST-AMARAVATHI"
  syncState: ReplicationSyncState;
  replicationLagBytes: number;
  replicationLagSeconds: number;
  lastWalReceivedLsn: string;
  lastWalReplayedLsn: string;
  healthy: boolean;
}

export interface FailoverDrillResultDto {
  drillId: string;
  simulatedOutageTarget: string;
  promotedStandbyNodeId: string;
  rpoSecondsAchieved: number;
  rtoSecondsAchieved: number;
  success: boolean;
  executedAt: string;
}

