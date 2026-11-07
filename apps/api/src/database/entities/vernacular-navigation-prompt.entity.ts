import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('vernacular_navigation_prompts')
export class VernacularNavigationPromptEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'captain_id', type: 'varchar', length: 120 })
  captainId: string;

  @Column({ name: 'vehicle_id', type: 'varchar', length: 120 })
  vehicleId: string;

  @Column({ name: 'prompt_text_telugu', type: 'text' })
  promptTextTelugu: string;

  @Column({ name: 'prompt_text_english', type: 'text' })
  promptTextEnglish: string;

  @Column({ name: 'suggested_facility_type', type: 'varchar', length: 64 })
  suggestedFacilityType: string;

  @Column({ name: 'target_facility_id', type: 'varchar', length: 120 })
  targetFacilityId: string;

  @Column({ name: 'target_facility_name', type: 'varchar', length: 120 })
  targetFacilityName: string;

  @Column({ name: 'detour_distance_meters', type: 'integer' })
  detourDistanceMeters: number;

  @Column({ name: 'audio_file_url', type: 'varchar', length: 256 })
  audioFileUrl: string;

  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt: Date;
}
