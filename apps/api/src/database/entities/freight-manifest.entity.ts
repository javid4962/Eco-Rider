import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('freight_manifests')
export class FreightManifest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'manifest_number', type: 'varchar', length: 50, unique: true })
  manifestNumber: string;

  @Column({ name: 'origin_hub_code', type: 'varchar', length: 50 })
  originHubCode: string;

  @Column({ name: 'destination_hub_code', type: 'varchar', length: 50 })
  destinationHubCode: string;

  @Column({ name: 'vehicle_registration_number', type: 'varchar', length: 50 })
  vehicleRegistrationNumber: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'total_consignments', type: 'int', default: 1 })
  totalConsignments: number;

  @Column({ name: 'gross_weight_kg', type: 'decimal', precision: 8, scale: 2 })
  grossWeightKg: number;

  @Column({ name: 'payload_capacity_kg', type: 'decimal', precision: 8, scale: 2 })
  payloadCapacityKg: number;

  @Column({ name: 'volumetric_utilization_percent', type: 'decimal', precision: 5, scale: 2 })
  volumetricUtilizationPercent: number;

  @Column({ name: 'consignments_data', type: 'jsonb' })
  consignmentsData: any[];

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'PLANNED' })
  status: string;

  @Column({ name: 'weighbridge_tare_weight_kg', type: 'decimal', precision: 8, scale: 2, nullable: true })
  weighbridgeTareWeightKg: number | null;

  @Column({ name: 'weighbridge_gross_weight_kg', type: 'decimal', precision: 8, scale: 2, nullable: true })
  weighbridgeGrossWeightKg: number | null;

  @Column({ name: 'dispatch_time', type: 'timestamp with time zone', nullable: true })
  dispatchTime: Date | null;

  @Column({ name: 'arrival_time', type: 'timestamp with time zone', nullable: true })
  arrivalTime: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

