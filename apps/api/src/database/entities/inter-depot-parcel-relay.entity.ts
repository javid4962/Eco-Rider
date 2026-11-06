import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('inter_depot_parcel_relays')
export class InterDepotParcelRelay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'consignment_id', type: 'varchar', length: 64 })
  consignmentId: string;

  @Column({ name: 'origin_locker_hub_id', type: 'varchar', length: 64 })
  originLockerHubId: string;

  @Column({ name: 'transit_depot_id', type: 'varchar', length: 64 })
  transitDepotId: string;

  @Column({ name: 'destination_locker_hub_id', type: 'varchar', length: 64 })
  destinationLockerHubId: string;

  @Column({ name: 'courier_van_vehicle_id', type: 'varchar', length: 64 })
  courierVanVehicleId: string;

  @Column({ name: 'courier_captain_id', type: 'varchar', length: 64 })
  courierCaptainId: string;

  @Column({ name: 'weight_grams', type: 'int' })
  weightGrams: number;

  @Column({ type: 'varchar', length: 32, default: 'SCHEDULED' })
  status: string;

  @Column({ name: 'current_location_hub', type: 'varchar', length: 64 })
  currentLocationHub: string;

  @Column({ name: 'next_scheduled_hub', type: 'varchar', length: 64 })
  nextScheduledHub: string;

  @Column({ name: 'verification_token', type: 'varchar', length: 64 })
  verificationToken: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
