import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('dr_replication_health')
export class DrReplicationHealth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'primary_node_id', type: 'varchar', length: 50 })
  primaryNodeId: string;

  @Column({ name: 'standby_node_id', type: 'varchar', length: 50 })
  standbyNodeId: string;

  @Column({ name: 'regional_data_center', type: 'varchar', length: 100 })
  regionalDataCenter: string;

  @Column({ name: 'sync_state', type: 'varchar', length: 50, default: 'STREAMING_HEALTHY' })
  syncState: string;

  @Column({ name: 'replication_lag_bytes', type: 'bigint', default: 0 })
  replicationLagBytes: number;

  @Column({ name: 'replication_lag_seconds', type: 'decimal', precision: 5, scale: 2, default: 0.1 })
  replicationLagSeconds: number;

  @Column({ name: 'last_wal_received_lsn', type: 'varchar', length: 50 })
  lastWalReceivedLsn: string;

  @Column({ name: 'last_wal_replayed_lsn', type: 'varchar', length: 50 })
  lastWalReplayedLsn: string;

  @Column({ name: 'healthy', type: 'boolean', default: true })
  healthy: boolean;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;
}

