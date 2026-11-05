import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('zero_emission_zones')
export class ZeroEmissionZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'zone_code', type: 'varchar', length: 50, unique: true })
  zoneCode: string;

  @Column({ name: 'zone_name', type: 'varchar', length: 150 })
  zoneName: string;

  @Column({ name: 'municipality', type: 'varchar', length: 100 })
  municipality: string;

  @Column({ name: 'active_penalty_paise_for_ice', type: 'int', default: 100000 })
  activePenaltyPaiseForIce: number;

  @Column({ name: 'enforce_bev_only', type: 'boolean', default: true })
  enforceBevOnly: boolean;

  @Column({ name: 'total_bev_crossings_today', type: 'int', default: 0 })
  totalBevCrossingsToday: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
