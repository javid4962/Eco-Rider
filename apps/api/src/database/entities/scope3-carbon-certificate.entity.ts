import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { CarbonStandard, OffsetVerificationStatus } from '@ecoride/contracts';

@Entity('scope3_carbon_certificates')
@Index('idx_scope3_cert_corp_month', ['corporateAccountId', 'reportingMonth'])
export class Scope3CarbonCertificateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'corporate_account_id', type: 'varchar', length: 64 })
  corporateAccountId!: string;

  @Column({ name: 'reporting_month', type: 'varchar', length: 16 })
  reportingMonth!: string;

  @Column({ name: 'standard', type: 'varchar', length: 64 })
  standard!: CarbonStandard;

  @Column({ name: 'total_electric_km', type: 'double precision' })
  totalElectricKm!: number;

  @Column({ name: 'avoided_co2_kg', type: 'double precision' })
  avoidedCo2Kg!: number;

  @Column({ name: 'displaced_diesel_liters', type: 'double precision' })
  displacedDieselLiters!: number;

  @Column({ name: 'verification_status', type: 'varchar', length: 32, default: OffsetVerificationStatus.CERTIFIED })
  verificationStatus!: OffsetVerificationStatus;

  @Column({ name: 'certificate_hash_sha256', type: 'varchar', length: 64 })
  certificateHashSha256!: string;

  @CreateDateColumn({ name: 'certified_at', type: 'timestamptz' })
  certifiedAt!: Date;
}
