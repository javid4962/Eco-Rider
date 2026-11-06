import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('v2v_rescue_missions')
export class V2vRescueMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'rescue_vehicle_id', type: 'varchar', length: 64 })
  rescueVehicleId: string;

  @Index()
  @Column({ name: 'rescue_captain_id', type: 'varchar', length: 64 })
  rescueCaptainId: string;

  @Index()
  @Column({ name: 'stranded_vehicle_id', type: 'varchar', length: 64 })
  strandedVehicleId: string;

  @Column({ type: 'varchar', length: 32, default: 'REQUESTED' })
  status: string;

  @Column({ name: 'eta_minutes', type: 'int', default: 15 })
  etaMinutes: number;

  @Column({ name: 'start_soc_percent', type: 'numeric', precision: 4, scale: 1 })
  startSocPercent: number;

  @Column({ name: 'target_kwh_required', type: 'numeric', precision: 5, scale: 2 })
  targetKwhRequired: number;

  @Column({ name: 'transferred_kwh', type: 'numeric', precision: 5, scale: 2, default: 0 })
  transferredKwh: number;

  @Column({ name: 'base_dispatch_fee_paise', type: 'int', default: 35000 })
  baseDispatchFeePaise: number;

  @Column({ name: 'energy_fee_paise', type: 'int', default: 0 })
  energyFeePaise: number;

  @Column({ name: 'gst_paise', type: 'int', default: 0 })
  gstPaise: number;

  @Column({ name: 'total_cost_paise', type: 'int', default: 0 })
  totalCostPaise: number;

  @Column({ name: 'highway_or_corridor', type: 'varchar', length: 128, nullable: true })
  highwayOrCorridor: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

