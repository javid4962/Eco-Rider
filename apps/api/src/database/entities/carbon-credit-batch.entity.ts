import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('carbon_credit_batches')
export class CarbonCreditBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'batch_identifier', type: 'varchar', length: 64 })
  batchIdentifier: string;

  @Column({ name: 'total_credits_minted', type: 'int' })
  totalCreditsMinted: number;

  @Column({ name: 'fractional_kg_carried_forward', type: 'numeric', precision: 8, scale: 2, default: 0 })
  fractionalKgCarriedForward: number;

  @Column({ name: 'total_avoided_co2_kg', type: 'numeric', precision: 10, scale: 2 })
  totalAvoidedCo2Kg: number;

  @Column({ name: 'total_electric_km', type: 'numeric', precision: 10, scale: 2 })
  totalElectricKm: number;

  @Column({ name: 'certifying_standard', type: 'varchar', length: 64 })
  certifyingStandard: string;

  @Column({ type: 'varchar', length: 32, default: 'MINTED' })
  status: string;

  @Column({ name: 'verification_hash', type: 'varchar', length: 128 })
  verificationHash: string;

  @CreateDateColumn({ name: 'minted_at', type: 'timestamptz' })
  mintedAt: Date;
}
