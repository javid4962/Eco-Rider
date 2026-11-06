import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('locker_access_logs')
export class LockerAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'locker_hub_id', type: 'varchar', length: 50 })
  lockerHubId: string;

  @Column({ name: 'compartment_number', type: 'varchar', length: 20 })
  compartmentNumber: string;

  @Column({ name: 'action', type: 'varchar', length: 30 }) // DEPOSIT, RETRIEVE, TIMEOUT
  action: string;

  @Column({ name: 'actor_phone', type: 'varchar', length: 20, nullable: true })
  actorPhone: string | null;

  @Column({ name: 'success', type: 'boolean', default: true })
  success: boolean;

  @CreateDateColumn({ name: 'logged_at' })
  loggedAt: Date;
}

