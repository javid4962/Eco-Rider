import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('cold_chain_excursion_claims')
export class ColdChainExcursionClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'cargo_trip_id', type: 'varchar', length: 64 })
  cargoTripId: string;

  @Index()
  @Column({ name: 'vehicle_id', type: 'varchar', length: 64 })
  vehicleId: string;

  @Index()
  @Column({ name: 'consignor_id', type: 'varchar', length: 64 })
  consignorId: string;

  @Column({ name: 'cargo_type', type: 'varchar', length: 64 })
  cargoType: string;

  @Column({ type: 'varchar', length: 32, default: 'EXCURSION_DETECTED' })
  status: string;

  @Column({ name: 'breach_temperature_celsius', type: 'numeric', precision: 5, scale: 2 })
  breachTemperatureCelsius: number;

  @Column({ name: 'min_allowed_temp_celsius', type: 'numeric', precision: 5, scale: 2 })
  minAllowedTempCelsius: number;

  @Column({ name: 'max_allowed_temp_celsius', type: 'numeric', precision: 5, scale: 2 })
  maxAllowedTempCelsius: number;

  @Column({ name: 'excursion_duration_minutes', type: 'int', default: 15 })
  excursionDurationMinutes: number;

  @Column({ name: 'declared_value_paise', type: 'bigint' })
  declaredValuePaise: string;

  @Column({ name: 'insurance_claim_amount_paise', type: 'int' })
  insuranceClaimAmountPaise: number;

  @Index({ unique: true })
  @Column({ name: 'claim_reference_number', type: 'varchar', length: 64 })
  claimReferenceNumber: string;

  @Column({ name: 'filing_reason', type: 'text' })
  filingReason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
