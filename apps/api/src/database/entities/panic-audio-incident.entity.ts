import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('panic_audio_incidents')
export class PanicAudioIncident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'ride_id', type: 'varchar', length: 64 })
  rideId: string;

  @Index()
  @Column({ name: 'captain_id', type: 'varchar', length: 64 })
  captainId: string;

  @Index()
  @Column({ name: 'rider_id', type: 'varchar', length: 64 })
  riderId: string;

  @Column({ name: 'audio_duration_seconds', type: 'int' })
  audioDurationSeconds: number;

  @Column({ name: 'audio_checksum', type: 'varchar', length: 128 })
  audioChecksum: string;

  @Column({ name: 'stream_decibels_max', type: 'numeric', precision: 5, scale: 2 })
  streamDecibelsMax: number;

  @Column({ type: 'varchar', length: 64 })
  severity: string;

  @Column({ name: 'police_112_notified', type: 'boolean', default: false })
  police112Notified: boolean;

  @Column({ name: 'police_dispatch_token', type: 'varchar', length: 64 })
  policeDispatchToken: string;

  @Column({ name: 'trigger_source', type: 'varchar', length: 64 })
  triggerSource: string;

  @Column({ name: 'action_taken', type: 'text' })
  actionTaken: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
