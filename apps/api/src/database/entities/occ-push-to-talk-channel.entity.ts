import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('occ_push_to_talk_channels')
export class OccPushToTalkChannelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'channel_id', type: 'varchar', length: 120, unique: true })
  channelId: string;

  @Column({ name: 'channel_name', type: 'varchar', length: 120 })
  channelName: string;

  @Column({ name: 'district', type: 'varchar', length: 64 })
  district: string;

  @Column({ name: 'active_listen_count', type: 'integer', default: 0 })
  activeListenCount: number;

  @Column({ name: 'last_broadcast_by', type: 'varchar', length: 120 })
  lastBroadcastBy: string;

  @Column({ name: 'priority', type: 'varchar', length: 32 })
  priority: string;

  @CreateDateColumn({ name: 'last_active_at', type: 'timestamptz' })
  lastActiveAt: Date;
}
