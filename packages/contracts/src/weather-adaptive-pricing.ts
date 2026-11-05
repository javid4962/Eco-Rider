export enum ApWeatherAlertSeverity {
  NORMAL = 'NORMAL',
  YELLOW_ALERT = 'YELLOW_ALERT',     // Heavy rain / 40°C heat advisory
  ORANGE_ALERT = 'ORANGE_ALERT',     // Severe cyclone warning / 43°C heatwave
  RED_ALERT = 'RED_ALERT',           // IMD Red alert / cyclone landfall
}

export enum WeatherEventType {
  HEATWAVE = 'HEATWAVE',
  CYCLONE_TORRENTIAL_RAIN = 'CYCLONE_TORRENTIAL_RAIN',
  FLOOD_WATERLOGGING = 'FLOOD_WATERLOGGING',
  CLEAR = 'CLEAR',
}

export interface WeatherConditionDto {
  zone: string;
  city: string;
  eventType: WeatherEventType;
  severity: ApWeatherAlertSeverity;
  ambientTemperatureCelsius: number;
  precipitationMmPerHour: number;
  windSpeedKmph: number;
  isWeatherHardshipActive: boolean;
  driverAllowanceMultiplier: number; // e.g. 1.15x for Yellow, 1.30x for Orange
}

export interface WeatherAdaptiveFareResultDto {
  baseFarePaise: number;
  weatherHardshipSurchargePaise: number;
  totalPassengerFarePaise: number;
  captainPassThroughAllowancePaise: number; // 100% passed through to captain
  platformCommissionOnSurchargePaise: number; // strictly 0 paise
  alertSeverity: ApWeatherAlertSeverity;
  advisoryNoteTelugu: string;
  advisoryNoteEnglish: string;
}

