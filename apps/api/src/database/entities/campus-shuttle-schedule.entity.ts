import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('campus_shuttle_schedules')
export class CampusShuttleSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'campus_code', type: 'varchar', length: 64 })
  campusCode: string;

  @Column({ name: 'loop_name', type: 'varchar', length: 128 })
  loopName: string;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 32 })
  vehicleType: string;

  @Column({ name: 'operating_frequency_minutes', type: 'int', default: 10 })
  operatingFrequencyMinutes: number;

  @Column({ name: 'first_departure_time', type: 'varchar', length: 16 })
  firstDepartureTime: string;

  @Column({ name: 'last_departure_time', type: 'varchar', length: 16 })
  lastDepartureTime: string;

  @Column({ name: 'fare_per_ride_paise', type: 'int', default: 1500 })
  farePerRidePaise: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
