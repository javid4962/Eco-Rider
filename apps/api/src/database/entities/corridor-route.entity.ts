import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CorridorVirtualStop } from '@ecoride/contracts';

@Entity('corridor_routes')
export class CorridorRoute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_corridor_routes_code', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50, name: 'origin_city' })
  originCity!: string;

  @Column({ type: 'varchar', length: 50, name: 'destination_city' })
  destinationCity!: string;

  @Column({ type: 'jsonb' })
  stops!: CorridorVirtualStop[];

  @Column({ type: 'int', default: 0, name: 'total_distance_meters' })
  totalDistanceMeters!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

