import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('captain_voice_preferences')
export class CaptainVoicePreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'captain_id', type: 'uuid', unique: true })
  captainId: string;

  @Column({ name: 'preferred_audio_language', type: 'varchar', length: 10, default: 'te' })
  preferredAudioLanguage: string; // 'te', 'en', 'ur', 'hi'

  @Column({ name: 'voice_announcements_enabled', type: 'boolean', default: true })
  voiceAnnouncementsEnabled: boolean;

  @Column({ name: 'announce_fares_aloud', type: 'boolean', default: true })
  announceFaresAloud: boolean;

  @Column({ name: 'slow_audio_cadence_enabled', type: 'boolean', default: false })
  slowAudioCadenceEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

