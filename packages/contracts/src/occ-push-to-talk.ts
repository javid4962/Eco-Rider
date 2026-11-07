export type PttPriorityLevel = 'DISPATCH' | 'SECURITY' | 'SOS_EMERGENCY';

export interface PttChannelBroadcastRequest {
  channelId: string;
  senderUserId: string;
  senderRole: 'OCC_DISPATCHER' | 'FIELD_MARSHAL' | 'RESCUE_COMMANDER';
  priority: PttPriorityLevel;
  audioPacketBase64?: string;
  durationMs: number;
}

export interface PttChannelRecord {
  id: string;
  channelId: string;
  channelName: string;
  district: string;
  activeListenCount: number;
  lastBroadcastBy: string;
  priority: PttPriorityLevel;
  lastActiveAt: string;
}
