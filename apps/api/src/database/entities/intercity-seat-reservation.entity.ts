import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { IntercityRoute, IntercitySeatStatus } from '@ecoride/contracts';

@Entity('intercity_seat_reservations')
@Index('idx_intercity_route_seat', ['route', 'seatNumber'])
export class IntercitySeatReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'passenger_id', type: 'varchar', length: 64 })
  passengerId!: string;

  @Column({ name: 'route', type: 'varchar', length: 64 })
  route!: IntercityRoute;

  @Column({ name: 'seat_number', type: 'integer' })
  seatNumber!: number;

  @Column({ name: 'fare_paid_paise', type: 'bigint' })
  farePaidPaise!: number;

  @Column({ name: 'gst_paise', type: 'bigint' })
  gstPaise!: number;

  @Column({ name: 'status', type: 'varchar', length: 32, default: IntercitySeatStatus.CONFIRMED })
  status!: IntercitySeatStatus;

  @Column({ name: 'qr_boarding_pass_payload', type: 'text' })
  qrBoardingPassPayload!: string;

  @CreateDateColumn({ name: 'reserved_at', type: 'timestamptz' })
  reservedAt!: Date;
}
