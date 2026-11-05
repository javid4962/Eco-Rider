import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('multi_modal_tickets')
@Index('idx_mm_tickets_number', ['ticketNumber'], { unique: true })
@Index('idx_mm_tickets_rider', ['riderId'])
@Index('idx_mm_tickets_booking', ['bookingId'])
export class MultiModalTicket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  ticketNumber!: string;

  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'uuid' })
  riderId!: string;

  @Column({ type: 'uuid' })
  transitHubId!: string;

  @Column({ type: 'varchar', length: 100 })
  transitHubName!: string;

  @Column({ type: 'timestamptz' })
  pickupTime!: Date;

  @Column({ type: 'timestamptz' })
  estimatedArrivalAtHub!: Date;

  @Column({ type: 'bigint' })
  farePaise!: string | number;

  @Column({ type: 'text' })
  unifiedQrPayload!: string;

  @Column({ type: 'varchar', length: 30, default: 'CONFIRMED' })
  status!: 'CONFIRMED' | 'BOARDED' | 'COMPLETED' | 'CANCELLED';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}

