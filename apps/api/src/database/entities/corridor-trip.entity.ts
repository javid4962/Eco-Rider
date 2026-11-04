import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CorridorTripStatus } from '@ecoride/contracts';

@Entity('corridor_trips')
@Index('idx_corridor_trips_schedule_date', ['scheduleId', 'tripDate'], { unique: true })
export class CorridorTrip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_corridor_trips_schedule')
  @Column({ type: 'uuid', name: 'schedule_id' })
  scheduleId!: string;

  @Index('idx_corridor_trips_route')
  @Column({ type: 'uuid', name: 'route_id' })
  routeId!: string;

  @Index('idx_corridor_trips_date')
  @Column({ type: 'date', name: 'trip_date' })
  tripDate!: string; // 'YYYY-MM-DD'

  @Column({ type: 'varchar', length: 10, name: 'departure_time' })
  departureTime!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: CorridorTripStatus.SCHEDULED,
    name: 'status',
  })
  status!: CorridorTripStatus | string;

  @Column({ type: 'int', default: 7, name: 'total_seats' })
  totalSeats!: number;

  @Column({ type: 'uuid', nullable: true, name: 'vehicle_id' })
  vehicleId?: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'captain_id' })
  captainId?: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

