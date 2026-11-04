import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { CodSettlementStatus } from '@ecoride/contracts';

@Entity('cargo_cod_settlements')
@Index('idx_cargo_cod_shipment', ['shipmentId'])
@Index('idx_cargo_cod_merchant', ['merchantAccountId'])
@Index('idx_cargo_cod_status', ['status'])
export class CargoCodSettlement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  shipmentId!: string;

  @Column({ type: 'uuid' })
  stopId!: string;

  @Column({ type: 'uuid' })
  captainId!: string;

  @Column({ type: 'uuid' })
  merchantAccountId!: string;

  @Column({ type: 'bigint' })
  amountPaise!: string | number;

  @Column({
    type: 'enum',
    enum: CodSettlementStatus,
    default: CodSettlementStatus.COLLECTED_BY_CAPTAIN,
  })
  status!: CodSettlementStatus;

  @Column({ type: 'timestamptz' })
  collectedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt!: Date | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  referenceId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

