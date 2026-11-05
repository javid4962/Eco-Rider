export enum IvrVoiceIntent {
  ACCEPT_OFFER = 'ACCEPT_OFFER',
  REJECT_OFFER = 'REJECT_OFFER',
  CALL_RIDER = 'CALL_RIDER',
  REPORT_EMERGENCY = 'REPORT_EMERGENCY',
  BATTERY_STATUS = 'BATTERY_STATUS',
}

export interface IvrVoiceSessionDto {
  sessionId: string;
  captainId: string;
  detectedUtterance: string;
  recognizedLanguage: 'te' | 'en';
  parsedIntent: IvrVoiceIntent;
  confidenceScore: number;
  systemActionTaken: string;
  processedAt: string;
}

export interface ProcessVoiceCommandDto {
  captainId: string;
  audioDurationSeconds: number;
  rawTranscript: string;
  language?: 'te' | 'en';
}

