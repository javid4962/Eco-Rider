import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('depot_bess_units')
export class DepotBessUnit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'depot_id', type: 'varchar', length: 64 })
  depotId: string;

  @Index({ unique: true })
  @Column({ name: 'bess_unit_code', type: 'varchar', length: 64 })
  bessUnitCode: string;

  @Column({ name: 'total_capacity_kwh', type: 'numeric', precision: 8, scale: 2 })
  totalCapacityKwh: number;

  @Column({ name: 'current_soc_percent', type: 'numeric', precision: 5, scale: 2 })
  currentSocPercent: number;

  @Column({ name: 'charge_rate_kw', type: 'numeric', precision: 6, scale: 2, default: 0 })
  chargeRateKw: number;

  @Column({ name: 'discharge_rate_kw', type: 'numeric', precision: 6, scale: 2, default: 0 })
  dischargeRateKw: number;

  @Column({ name: 'temperature_celsius', type: 'numeric', precision: 5, scale: 2 })
  temperatureCelsius: number;

  @Column({ name: 'current_mode', type: 'varchar', length: 32, default: 'IDLE_STANDBY' })
  currentMode: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

