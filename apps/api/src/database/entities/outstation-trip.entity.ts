import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('outstation_trips')
export class OutstationTrip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_id', type: 'uuid' })
  routeId: string;

  @Column({ name: 'rider_id', type: 'uuid' })
  riderId: string;

  @Column({ name: 'captain_id', type: 'uuid', nullable: true })
  captainId: string | null;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId: string | null;

  @Column({ name: 'pickup_address', type: 'text' })
  pickupAddress: string;

  @Column({ name: 'dropoff_address', type: 'text' })
  dropoffAddress: string;

  @Column({ name: 'departure_time', type: 'timestamptz' })
  departureTime: Date;

  @Column({ name: 'passenger_count', type: 'int', default: 1 })
  passengerCount: number;

  @Column({ name: 'fare_paise', type: 'int' })
  farePaise: number;

  @Column({ name: 'toll_paise', type: 'int', default: 0 })
  tollPaise: number;

  @Column({ name: 'total_fare_paise', type: 'int' })
  totalFarePaise: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'REQUESTED' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

