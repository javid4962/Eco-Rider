import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { VernacularDialect, VoicePromptCategory } from '@ecoride/contracts';

@Entity('vernacular_voice_prompt_logs')
@Index('idx_voice_prompt_captain_cat', ['captainId', 'category'])
export class VernacularVoicePromptLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'captain_id', type: 'varchar', length: 64 })
  captainId!: string;

  @Column({ name: 'dialect', type: 'varchar', length: 32 })
  dialect!: VernacularDialect;

  @Column({ name: 'category', type: 'varchar', length: 64 })
  category!: VoicePromptCategory;

  @Column({ name: 'spoken_script_text', type: 'text' })
  spokenScriptText!: string;

  @Column({ name: 'haptic_pattern', type: 'varchar', length: 64 })
  hapticPattern!: string;

  @Column({ name: 'estimated_audio_duration_seconds', type: 'integer' })
  estimatedAudioDurationSeconds!: number;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt!: Date;
}
