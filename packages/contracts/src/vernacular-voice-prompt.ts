export enum VernacularDialect {
  TELUGU_COASTAL_ANDHRA = 'TELUGU_COASTAL_ANDHRA',
  TELUGU_RAYALASEEMA = 'TELUGU_RAYALASEEMA',
  URDU_DECCANI = 'URDU_DECCANI',
  ENGLISH_INDIAN = 'ENGLISH_INDIAN',
}

export enum VoicePromptCategory {
  PICKUP_ARRIVAL = 'PICKUP_ARRIVAL',
  BATTERY_LOW_REROUTE = 'BATTERY_LOW_REROUTE',
  TURNAROUND_DETOUR = 'TURNAROUND_DETOUR',
  TRIP_COMPLETED_FARE = 'TRIP_COMPLETED_FARE',
}

export interface GenerateVoicePromptDto {
  captainId: string;
  dialect: VernacularDialect;
  category: VoicePromptCategory;
  parameterValue?: string; // e.g. "₹85" or "15%"
}

export interface VernacularVoicePromptResult {
  promptId: string;
  dialect: VernacularDialect;
  category: VoicePromptCategory;
  spokenScriptText: string;
  hapticPattern: string; // e.g. "SHORT_SHORT_LONG"
  estimatedAudioDurationSeconds: number;
  generatedAt: Date;
}

