import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('depot_gate_access_logs')
export class DepotGateAccessLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'depot_id', type: 'varchar', length: 120 })
  depotId: string;

  @Column({ name: 'gate_id', type: 'varchar', length: 64 })
  gateId: string;

  @Column({ name: 'gate_type', type: 'varchar', length: 32 })
  gateType: string;

  @Index()
  @Column({ name: 'plate_number', type: 'varchar', length: 32 })
  plateNumber: string;

  @Column({ name: 'rfid_tag_id', type: 'varchar', length: 64 })
  rfidTagId: string;

  @Column({ name: 'decision', type: 'varchar', length: 64 })
  decision: string;

  @Column({ name: 'barrier_opened', type: 'boolean', default: false })
  barrierOpened: boolean;

  @Column({ name: 'reason', type: 'varchar', length: 256 })
  reason: string;

  @CreateDateColumn({ name: 'scanned_at', type: 'timestamptz' })
  scannedAt: Date;
}

