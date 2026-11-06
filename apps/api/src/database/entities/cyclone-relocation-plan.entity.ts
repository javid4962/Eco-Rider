import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('cyclone_relocation_plans')
export class CycloneRelocationPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'cyclone_name', type: 'varchar', length: 64 })
  cycloneName: string;

  @Column({ name: 'alert_level', type: 'varchar', length: 32 })
  alertLevel: string;

  @Column({ name: 'source_flood_zone', type: 'varchar', length: 128 })
  sourceFloodZone: string;

  @Column({ name: 'target_safe_staging_hub', type: 'varchar', length: 128 })
  targetSafeStagingHub: string;

  @Column({ name: 'total_vehicles_targeted', type: 'int', default: 0 })
  totalVehiclesTargeted: number;

  @Column({ name: 'successfully_staged_count', type: 'int', default: 0 })
  successfullyStagedCount: number;

  @Column({ name: 'relocation_status', type: 'varchar', length: 32, default: 'PLAN_GENERATED' })
  relocationStatus: string;

  @Column({ name: 'elevation_delta_meters', type: 'numeric', precision: 5, scale: 1, default: 0 })
  elevationDeltaMeters: number;

  @Column({ type: 'text' })
  instructions: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

