import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('fleet_lease_contracts')
export class FleetLeaseContract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fleet_owner_id', type: 'uuid' })
  fleetOwnerId: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'lease_model', type: 'varchar', length: 50 })
  leaseModel: string; // 'FIXED_DAILY_RENTAL' or 'PERCENTAGE_SPLIT'

  @Column({ name: 'daily_rent_paise', type: 'int', nullable: true })
  dailyRentPaise: number | null;

  @Column({ name: 'owner_share_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  ownerSharePercent: number | null;

  @Column({ name: 'captain_share_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  captainSharePercent: number | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

