import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'executive_kpi_snapshots' })
export class ExecutiveKpiSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_date', type: 'varchar', length: 16, unique: true })
  reportDate: string;

  @Column({ name: 'total_zero_emission_km', type: 'numeric', precision: 12, scale: 2 })
  totalZeroEmissionKm: number;

  @Column({ name: 'total_passengers_moved', type: 'int' })
  totalPassengersMoved: number;

  @Column({ name: 'active_green_plate_vehicles', type: 'int' })
  activeGreenPlateVehicles: number;

  @Column({ name: 'co2_avoided_kg', type: 'numeric', precision: 12, scale: 2 })
  co2AvoidedKg: number;

  @Column({ name: 'gst_passenger_5pct_paise', type: 'bigint' })
  gstPassenger5PctPaise: number;

  @Column({ name: 'gst_cargo_18pct_paise', type: 'bigint' })
  gstCargo18PctPaise: number;

  @Column({ name: 'gst_services_18pct_paise', type: 'bigint' })
  gstServices18PctPaise: number;

  @Column({ name: 'total_gst_collected_paise', type: 'bigint' })
  totalGstCollectedPaise: number;

  @Column({ name: 'safety_incident_rate_per_million_km', type: 'numeric', precision: 5, scale: 2 })
  safetyIncidentRatePerMillionKm: number;

  @Column({ name: 'cryptographic_signature', type: 'varchar', length: 128 })
  cryptographicSignature: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
