import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { DocumentType, DocumentStatus, RetentionPolicy } from '@ecoride/contracts';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_documents_user_id')
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 50, name: 'document_type' })
  documentType!: DocumentType | string;

  @Column({ type: 'varchar', length: 255, name: 'original_filename' })
  originalFilename!: string;

  @Index('idx_documents_storage_key', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true, name: 'storage_key' })
  storageKey!: string;

  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mimeType!: string;

  @Column({ type: 'int', name: 'file_size_bytes' })
  fileSizeBytes!: number;

  @Column({ type: 'varchar', length: 64, name: 'sha256_checksum' })
  sha256Checksum!: string;

  @Index('idx_documents_scan_status')
  @Column({
    type: 'varchar',
    length: 30,
    default: DocumentStatus.PENDING_SCAN,
    name: 'scan_status',
  })
  scanStatus!: DocumentStatus | string;

  @Column({ type: 'jsonb', nullable: true, name: 'scan_details' })
  scanDetails?: Record<string, unknown>;

  @Column({
    type: 'varchar',
    length: 50,
    default: RetentionPolicy.KYC_STATUTORY_5_YEARS,
    name: 'retention_policy',
  })
  retentionPolicy!: RetentionPolicy | string;

  @Index('idx_documents_expires_at')
  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt?: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
