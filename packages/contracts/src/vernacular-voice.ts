export enum VoicePromptEvent {
  DISPATCH_OFFER_RECEIVED = 'DISPATCH_OFFER_RECEIVED',
  PASSENGER_PICKUP_APPROACHING = 'PASSENGER_PICKUP_APPROACHING',
  ASK_RIDER_START_OTP = 'ASK_RIDER_START_OTP',
  LOW_BATTERY_WARNING = 'LOW_BATTERY_WARNING',
  EMERGENCY_SOS_COUNTDOWN = 'EMERGENCY_SOS_COUNTDOWN',
  TRIP_COMPLETED_FARE_ANNOUNCEMENT = 'TRIP_COMPLETED_FARE_ANNOUNCEMENT',
}

export interface VoicePromptDto {
  event: VoicePromptEvent;
  language: 'te' | 'en' | 'ur' | 'hi';
  transcriptText: string;
  audioAssetUrl?: string;
  durationSeconds: number;
}

export interface CaptainVoiceSettingsDto {
  captainId: string;
  preferredAudioLanguage: 'te' | 'en' | 'ur' | 'hi';
  voiceAnnouncementsEnabled: boolean;
  announceFaresAloud: boolean;
  slowAudioCadenceEnabled: boolean;
}

