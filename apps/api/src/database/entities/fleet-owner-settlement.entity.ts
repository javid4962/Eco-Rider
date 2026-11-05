import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('fleet_owner_settlements')
export class FleetOwnerSettlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'settlement_date', type: 'date' })
  settlementDate: string;

  @Column({ name: 'fleet_owner_id', type: 'uuid' })
  fleetOwnerId: string;

  @Column({ name: 'active_vehicles_count', type: 'int', default: 1 })
  activeVehiclesCount: number;

  @Column({ name: 'total_trips_completed', type: 'int', default: 0 })
  totalTripsCompleted: number;

  @Column({ name: 'gross_fares_collected_paise', type: 'int', default: 0 })
  grossFaresCollectedPaise: number;

  @Column({ name: 'captain_payouts_paise', type: 'int', default: 0 })
  captainPayoutsPaise: number;

  @Column({ name: 'electricity_deductions_paise', type: 'int', default: 0 })
  electricityDeductionsPaise: number;

  @Column({ name: 'maintenance_reserves_paise', type: 'int', default: 0 })
  maintenanceReservesPaise: number;

  @Column({ name: 'net_fleet_owner_earnings_paise', type: 'int', default: 0 })
  netFleetOwnerEarningsPaise: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'PROCESSED' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

