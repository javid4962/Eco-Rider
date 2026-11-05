import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rescue_requests')
export class RescueRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_number', type: 'varchar', length: 50, unique: true })
  ticketNumber: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'service_type', type: 'varchar', length: 50 })
  serviceType: string;

  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({ name: 'landmark', type: 'varchar', length: 255 })
  landmark: string;

  @Column({ name: 'current_soc_percent', type: 'decimal', precision: 5, scale: 2 })
  currentSocPercent: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'REQUESTED' })
  status: string;

  @Column({ name: 'assigned_rescue_unit_id', type: 'uuid', nullable: true })
  assignedRescueUnitId: string | null;

  @Column({ name: 'estimated_arrival_minutes', type: 'int', nullable: true })
  estimatedArrivalMinutes: number | null;

  @Column({ name: 'fee_paise', type: 'int', default: 35000 })
  feePaise: number;

  @Column({ name: 'gst_paise', type: 'int', default: 6300 })
  gstPaise: number; // 18% SAC 9987

  @Column({ name: 'total_amount_paise', type: 'int', default: 41300 })
  totalAmountPaise: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date | null;
}

