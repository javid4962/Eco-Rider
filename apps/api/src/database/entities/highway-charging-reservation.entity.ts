import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('highway_charging_reservations')
export class HighwayChargingReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reservation_id', type: 'varchar', length: 50, unique: true })
  reservationId: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'highway_plaza_id', type: 'varchar', length: 50 })
  highwayPlazaId: string;

  @Column({ name: 'highway_name', type: 'varchar', length: 50, default: 'NH-16' })
  highwayName: string;

  @Column({ name: 'bay_number', type: 'varchar', length: 20 })
  bayNumber: string;

  @Column({ name: 'target_arrival_window_start', type: 'timestamp with time zone' })
  targetArrivalWindowStart: Date;

  @Column({ name: 'target_arrival_window_end', type: 'timestamp with time zone' })
  targetArrivalWindowEnd: Date;

  @Column({ name: 'deposit_paise', type: 'int', default: 10000 })
  depositPaise: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'RESERVED' })
  status: string;

  @CreateDateColumn({ name: 'reserved_at' })
  reservedAt: Date;
}
