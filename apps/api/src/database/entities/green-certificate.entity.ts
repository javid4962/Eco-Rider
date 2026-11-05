import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('green_certificates')
@Index('idx_green_certs_number', ['certificateNumber'], { unique: true })
@Index('idx_green_certs_recipient', ['recipientId', 'recipientType'])
export class GreenCertificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  certificateNumber!: string;

  @Column({ type: 'varchar', length: 30 })
  recipientType!: 'RIDER' | 'CAPTAIN' | 'CORPORATE';

  @Column({ type: 'uuid' })
  recipientId!: string;

  @Column({ type: 'varchar', length: 100 })
  recipientName!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0.0 })
  totalElectricKm!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0.0 })
  totalCo2SavedKg!: number;

  @Column({ type: 'int', default: 0 })
  totalGreenTrips!: number;

  @Column({ type: 'varchar', length: 50, default: 'SAPLING' })
  badgeLevel!: 'SAPLING' | 'ECO_WARRIOR' | 'CARBON_NEUTRAL_CHAMPION' | 'NET_ZERO_HERO';

  @Column({ type: 'varchar', length: 255 })
  verificationUrl!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  issuedAt!: Date;
}

