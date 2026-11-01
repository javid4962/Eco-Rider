/**
 * Synthetic test fixtures for EcoRide.
 * Contains only synthetic, fictitious test entities for testing environments.
 * No real PII, credentials, or production tokens.
 */

export const SYNTHETIC_ZONE_VIZAG = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Visakhapatnam Urban Zone',
  state: 'Andhra Pradesh',
  isActive: true,
  allowedPropulsion: ['ELECTRIC'],
  centroid: {
    latitude: 17.6868,
    longitude: 83.2185,
  },
};

export const SYNTHETIC_DRIVER_FIXTURE = {
  id: '00000000-0000-4000-8000-000000000002',
  fullName: 'Synthetic AP Captain',
  phoneMasked: '+91 98765 XXXXX',
  vehicle: {
    propulsion: 'ELECTRIC' as const,
    model: 'Synthetic e-Scooter 3000',
    batteryKwh: 3.7,
    batteryPercentage: 88,
  },
};

export const SYNTHETIC_HEALTH_OK = {
  status: 'ok' as const,
  service: 'ecoride-api',
  dependencies: {
    database: { status: 'up' as const },
    redis: { status: 'up' as const },
  },
};
