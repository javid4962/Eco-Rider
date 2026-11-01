import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';

@Entity('vehicles')
@Check(`"propulsion_type" = 'BATTERY_ELECTRIC'`)
@Check(`"current_soc_percent" >= 0.00 AND "current_soc_percent" <= 100.00`)
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_vehicles_registration')
  @Column({ type: 'varchar', length: 30, unique: true, name: 'registration_number' })
  registrationNumber!: string;

  @Column({ type: 'varchar', length: 30, name: 'propulsion_type', default: 'BATTERY_ELECTRIC' })
  propulsionType!: 'BATTERY_ELECTRIC';

  @Column({ type: 'numeric', precision: 6, scale: 2, name: 'battery_capacity_kwh' })
  batteryCapacityKwh!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, name: 'current_soc_percent', default: 100.0 })
  currentSocPercent!: number;

  @Index('idx_vehicles_category')
  @Column({ type: 'varchar', length: 50, name: 'vehicle_category' })
  vehicleCategory!: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

