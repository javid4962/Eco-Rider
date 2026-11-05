import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ivr_voice_sessions')
export class IvrVoiceSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'varchar', length: 50, unique: true })
  sessionId: string;

  @Column({ name: 'captain_id', type: 'uuid' })
  captainId: string;

  @Column({ name: 'detected_utterance', type: 'text' })
  detectedUtterance: string;

  @Column({ name: 'recognized_language', type: 'varchar', length: 10, default: 'te' })
  recognizedLanguage: string;

  @Column({ name: 'parsed_intent', type: 'varchar', length: 50 })
  parsedIntent: string;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 4, scale: 2, default: 0.95 })
  confidenceScore: number;

  @Column({ name: 'system_action_taken', type: 'varchar', length: 150 })
  systemActionTaken: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}

