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

@Entity('saved_locations')
export class SavedLocation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_saved_locations_user_id')
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.savedLocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 50 })
  label!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'BOTH',
    name: 'address_type',
  })
  addressType!: string;

  @Column({ type: 'varchar', length: 255, name: 'address_line' })
  addressLine!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  landmark?: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (typeof value === 'string' ? parseFloat(value) : value),
    },
  })
  latitude!: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 7,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => (typeof value === 'string' ? parseFloat(value) : value),
    },
  })
  longitude!: number;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location?: string | object;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
