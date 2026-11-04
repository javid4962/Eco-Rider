export interface AppConfig {
  nodeEnv: string;
  port: number;
  serviceName: string;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  otp: {
    providerType: string;
    msg91: {
      enabled: boolean;
      authKey?: string;
      senderId: string;
      baseUrl: string;
      timeoutMs: number;
      maxRetries: number;
      dltPeId: string;
    };
  };
  batteryDispatch: {
    minReserveSocPercent: number;
    minReserveRangeKm: number;
    contingencyChargerDistanceKm: number;
    telemetryMaxAgeSeconds: number;
    maxPickupDistanceKm: number;
  };
}

export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  serviceName: process.env.SERVICE_NAME || 'ecoride-api',
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'ecoride_dev',
    password: process.env.DATABASE_PASSWORD || 'ecoride_dev_secret',
    name: process.env.DATABASE_NAME || 'ecoride_db',
    ssl: process.env.DATABASE_SSL === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  otp: {
    providerType: process.env.OTP_PROVIDER_TYPE || 'MOCK',
    msg91: {
      enabled: process.env.MSG91_ENABLED === 'true',
      authKey: process.env.MSG91_AUTH_KEY || undefined,
      senderId: process.env.MSG91_SENDER_ID || 'ECORID',
      baseUrl: process.env.MSG91_BASE_URL || 'https://control.msg91.com/api/v5/otp',
      timeoutMs: parseInt(process.env.MSG91_TIMEOUT_MS || '5000', 10),
      maxRetries: parseInt(process.env.MSG91_MAX_RETRIES || '2', 10),
      dltPeId: process.env.MSG91_DLT_PE_ID || '1101550000000012345',
    },
  },
  batteryDispatch: {
    minReserveSocPercent: parseFloat(process.env.EV_DISPATCH_MIN_RESERVE_SOC || '15.0'),
    minReserveRangeKm: parseFloat(process.env.EV_DISPATCH_MIN_RESERVE_RANGE_KM || '8.0'),
    contingencyChargerDistanceKm: parseFloat(
      process.env.EV_DISPATCH_CONTINGENCY_CHARGER_KM || '5.0',
    ),
    telemetryMaxAgeSeconds: parseInt(
      process.env.EV_DISPATCH_TELEMETRY_MAX_AGE_SECONDS || '120',
      10,
    ),
    maxPickupDistanceKm: parseFloat(process.env.EV_DISPATCH_MAX_PICKUP_DISTANCE_KM || '15.0'),
  },
});
