import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('emergency_power_missions')
export class EmergencyPowerMission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mission_id', type: 'varchar', length: 50, unique: true })
  missionId: string;

  @Column({ name: 'target_facility_name', type: 'varchar', length: 150 })
  targetFacilityName: string;

  @Column({ name: 'facility_type', type: 'varchar', length: 50 })
  facilityType: string;

  @Column({ name: 'assigned_fleet_vehicle_number', type: 'varchar', length: 50 })
  assignedFleetVehicleNumber: string;

  @Column({ name: 'inverter_capacity_kw', type: 'int', default: 60 })
  inverterCapacityKw: number;

  @Column({ name: 'battery_reserve_kwh', type: 'int', default: 70 })
  batteryReserveKwh: number;

  @Column({ name: 'duration_hours_estimated', type: 'int', default: 4 })
  durationHoursEstimated: number;

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'STANDBY' })
  status: string;

  @CreateDateColumn({ name: 'dispatched_at' })
  dispatchedAt: Date;
}
