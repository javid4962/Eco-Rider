import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CurtailmentLevel, GridFrequencyStatus } from '@ecoride/contracts';

@Entity({ name: 'grid_curtailment_events' })
export class GridCurtailmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'substation_id', type: 'varchar', length: 120 })
  substationId: string;

  @Column({ name: 'grid_frequency_hz', type: 'numeric', precision: 5, scale: 2 })
  gridFrequencyHz: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: GridFrequencyStatus,
    default: GridFrequencyStatus.NORMAL,
  })
  status: GridFrequencyStatus;

  @Column({
    name: 'curtailment_level',
    type: 'enum',
    enum: CurtailmentLevel,
    default: CurtailmentLevel.NONE,
  })
  curtailmentLevel: CurtailmentLevel;

  @Column({ name: 'total_curtailed_kw', type: 'numeric', precision: 8, scale: 2, default: 0 })
  totalCurtailedKw: number;

  @Column({ name: 'ancillary_credit_paise', type: 'bigint', default: 0 })
  ancillaryCreditPaise: number;

  @Column({ name: 'affected_gun_count', type: 'int', default: 0 })
  affectedGunCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
