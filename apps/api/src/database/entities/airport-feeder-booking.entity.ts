import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('airport_feeder_bookings')
export class AirportFeederBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'rider_id', type: 'varchar', length: 64 })
  riderId: string;

  @Index()
  @Column({ name: 'flight_number', type: 'varchar', length: 32 })
  flightNumber: string;

  @Column({ type: 'varchar', length: 64 })
  airline: string;

  @Column({ name: 'origin_iata', type: 'varchar', length: 8 })
  originIata: string;

  @Column({ name: 'scheduled_arrival_time', type: 'timestamptz' })
  scheduledArrivalTime: Date;

  @Column({ name: 'actual_arrival_time', type: 'timestamptz', nullable: true })
  actualArrivalTime: Date | null;

  @Column({ name: 'delay_minutes', type: 'int', default: 0 })
  delayMinutes: number;

  @Column({ name: 'assigned_pickup_bay', type: 'varchar', length: 64, default: 'EV_DEDICATED_BAY_01' })
  assignedPickupBay: string;

  @Column({ type: 'varchar', length: 32, default: 'CONFIRMED' })
  status: string;

  @Column({ name: 'fare_paise', type: 'int' })
  farePaise: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

