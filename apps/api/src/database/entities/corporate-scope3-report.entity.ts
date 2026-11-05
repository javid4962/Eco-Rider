import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('corporate_scope3_reports')
export class CorporateScope3Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'corporate_account_id', type: 'uuid' })
  corporateAccountId: string;

  @Column({ name: 'company_name', type: 'varchar', length: 150 })
  companyName: string;

  @Column({ name: 'reporting_period', type: 'varchar', length: 50 })
  reportingPeriod: string;

  @Column({ name: 'total_electric_trips', type: 'int' })
  totalElectricTrips: number;

  @Column({ name: 'total_passenger_km', type: 'decimal', precision: 10, scale: 2 })
  totalPassengerKm: number;

  @Column({ name: 'baseline_ice_emissions_kg_co2e', type: 'decimal', precision: 10, scale: 2 })
  baselineIceEmissionsKgCo2e: number;

  @Column({ name: 'ev_emissions_kg_co2e', type: 'decimal', precision: 10, scale: 2, default: 0 })
  evEmissionsKgCo2e: number;

  @Column({ name: 'net_emissions_avoided_kg_co2e', type: 'decimal', precision: 10, scale: 2 })
  netEmissionsAvoidedKgCo2e: number;

  @Column({ name: 'diesel_displaced_liters', type: 'decimal', precision: 10, scale: 2 })
  dieselDisplacedLiters: number;

  @Column({ name: 'petrol_displaced_liters', type: 'decimal', precision: 10, scale: 2 })
  petrolDisplacedLiters: number;

  @Column({ name: 'iso_14064_hash', type: 'varchar', length: 64 })
  iso14064Hash: string;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;
}

