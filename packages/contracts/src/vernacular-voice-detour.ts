export interface LowBatteryDetourAlert {
  captainId: string;
  vehicleId: string;
  currentSocPct: number;
  currentLat: number;
  currentLng: number;
  remainingRangeKm: number;
}

export interface TeluguVoicePromptResult {
  id: string;
  captainId: string;
  vehicleId: string;
  promptTextTelugu: string;
  promptTextEnglish: string;
  suggestedFacilityType: 'SWAP_STATION' | 'FAST_CHARGER';
  targetFacilityId: string;
  targetFacilityName: string;
  detourDistanceMeters: number;
  audioFileUrl: string;
  generatedAt: string;
}
