import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('lost_item_reports')
export class LostItemReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_number', type: 'varchar', length: 50, unique: true })
  reportNumber: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'rider_id', type: 'uuid' })
  riderId: string;

  @Column({ name: 'item_type', type: 'varchar', length: 50 })
  itemType: string;

  @Column({ name: 'item_description', type: 'text' })
  itemDescription: string;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'REPORTED' })
  status: string;

  @Column({ name: 'tokenized_contact_url', type: 'varchar', length: 255 })
  tokenizedContactUrl: string;

  @CreateDateColumn({ name: 'reported_at' })
  reportedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

