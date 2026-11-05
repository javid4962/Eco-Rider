import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('regulatory_audit_logs')
export class RegulatoryAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_period', type: 'varchar', length: 20 })
  reportPeriod: string; // e.g. '2026-11'

  @Column({ name: 'authority', type: 'varchar', length: 50, default: 'AP_STA' })
  authority: string;

  @Column({ name: 'active_commercial_evs', type: 'int' })
  activeCommercialEvs: number;

  @Column({ name: 'electric_trips_completed', type: 'int' })
  electricTripsCompleted: number;

  @Column({ name: 'zero_emission_kilometers', type: 'decimal', precision: 10, scale: 2 })
  zeroEmissionKilometers: number;

  @Column({ name: 'co2_avoided_kg', type: 'decimal', precision: 10, scale: 2 })
  co2AvoidedKg: number;

  @Column({ name: 'ice_exclusions_enforced', type: 'int' })
  iceExclusionsEnforced: number;

  @Column({ name: 'statutory_gst_paise', type: 'int' })
  statutoryGstPaise: number;

  @Column({ name: 'digital_signature_sha256', type: 'varchar', length: 64 })
  digitalSignatureSha256: string;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;
}

