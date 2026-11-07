import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('corporate_shift_reconciliations')
export class CorporateShiftReconciliationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'manifest_id', type: 'varchar', length: 120, unique: true })
  manifestId: string;

  @Column({ name: 'route_id', type: 'varchar', length: 120 })
  routeId: string;

  @Column({ name: 'total_scheduled', type: 'integer' })
  totalScheduled: number;

  @Column({ name: 'total_boarded', type: 'integer' })
  totalBoarded: number;

  @Column({ name: 'total_absent', type: 'integer' })
  totalAbsent: number;

  @Column({ name: 'vehicle_capacity', type: 'integer' })
  vehicleCapacity: number;

  @Column({ name: 'occupancy_rate_pct', type: 'numeric', precision: 5, scale: 2 })
  occupancyRatePct: number;

  @Column({ name: 'skipped_stops_count', type: 'integer', default: 0 })
  skippedStopsCount: number;

  @CreateDateColumn({ name: 'reconciled_at', type: 'timestamptz' })
  reconciledAt: Date;
}
