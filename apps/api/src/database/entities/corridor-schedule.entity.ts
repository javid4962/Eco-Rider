import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('corridor_schedules')
export class CorridorSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_corridor_schedules_route')
  @Column({ type: 'uuid', name: 'route_id' })
  routeId!: string;

  @Column({ type: 'varchar', length: 10, name: 'departure_time' })
  departureTime!: string; // 'HH:MM'

  @Column({ type: 'int', array: true, name: 'days_of_week' })
  daysOfWeek!: number[]; // [1,2,3,4,5,6,7]

  @Column({ type: 'int', default: 7, name: 'total_seats' })
  totalSeats!: number;

  @Column({ type: 'bigint', default: 2500, name: 'base_segment_fare_paise' })
  baseSegmentFarePaise!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

