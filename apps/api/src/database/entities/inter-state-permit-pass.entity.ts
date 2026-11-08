import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { InterStateCorridor, InterStatePermitStatus } from '@ecoride/contracts';

@Entity('inter_state_permit_passes')
@Index('idx_interstate_vehicle_corridor', ['vehicleId', 'corridor'])
export class InterStatePermitPassEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId!: string;

  @Column({ name: 'corridor', type: 'varchar', length: 64 })
  corridor!: InterStateCorridor;

  @Column({ name: 'permit_number', type: 'varchar', length: 64 })
  permitNumber!: string;

  @Column({ name: 'status', type: 'varchar', length: 32 })
  status!: InterStatePermitStatus;

  @Column({ name: 'is_cleared_for_border_transit', type: 'boolean', default: false })
  isClearedForBorderTransit!: boolean;

  @Column({ name: 'border_toll_deduction_paise', type: 'bigint', default: 0 })
  borderTollDeductionPaise!: number;

  @Column({ name: 'fastag_deducted', type: 'boolean', default: false })
  fastagDeducted!: boolean;

  @Column({ name: 'inter_state_transit_manifest_id', type: 'varchar', length: 64 })
  interStateTransitManifestId!: string;

  @CreateDateColumn({ name: 'issued_at', type: 'timestamptz' })
  issuedAt!: Date;
}
