/**
 * EcoRide Service Cities, Polygonal Geofence Zones & Category Switches (EV-031)
 *
 * Defines municipal service territories, PostGIS polygonal operational zones,
 * statutory permit expiry boundaries, evidence references, and backend-authoritative
 * category switches (with all real categories disabled by default).
 */

export enum ZoneOperationalStatus {
  ACTIVE = 'ACTIVE',
  PILOT = 'PILOT',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum CityOperationalStatus {
  ACTIVE = 'ACTIVE',
  PILOT = 'PILOT',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

/**
 * All real mobility categories must default to disabled per AGENTS.md Rule 3
 * and EV-031 scope constraints.
 */
export const DEFAULT_DISABLED_CATEGORY_SWITCHES: Readonly<Record<string, boolean>> = Object.freeze({
  CITY_COMMUTE_2W: false,
  AUTO_COMMUTE_3W: false,
  CAB_PRIVATE_4W: false,
  VAN_COMMUTE_4W: false,
  private_ev: false,
  scheduled_sharing: false,
  commuter_pass: false,
  on_time_guarantee: false,
  fleet_optimization: false,
});

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array of linear rings: [[ [lng, lat], [lng, lat], ... ]]
}

export interface ServiceCityDto {
  id: string;
  code: string;
  name: string;
  state: string;
  operationalStatus: CityOperationalStatus | string;
  evidenceReference?: string | null;
  permitExpiresAt?: string | null;
  categorySwitches: Record<string, boolean>;
  centerLatitude: number;
  centerLongitude: number;
  activeZonesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceZoneDto {
  id: string;
  code: string;
  name: string;
  city: string;
  operationalStatus: ZoneOperationalStatus | string;
  evidenceReference?: string | null;
  permitExpiresAt?: string | null;
  categorySwitches: Record<string, boolean>;
  boundary: GeoJsonPolygon;
  centerLatitude?: number | null;
  centerLongitude?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerifyLocationRequest {
  city: string;
  latitude: number;
  longitude: number;
  serviceCategory: string;
  clientForgedAvailability?: boolean; // Used in test suites to verify client cannot spoof availability
}

export interface VerifyLocationResponse {
  isAuthorized: boolean;
  zoneId?: string | null;
  zoneCode?: string | null;
  zoneName?: string | null;
  city: string;
  serviceCategory: string;
  isInsideGeofence: boolean;
  isPermitValid: boolean;
  isCategoryEnabled: boolean;
  operationalStatus: string;
  permitExpiresAt?: string | null;
  rejectionReason?: string | null;
  evaluatedAt: string;
}

export interface CreateServiceCityRequest {
  code: string;
  name: string;
  state?: string;
  operationalStatus?: CityOperationalStatus;
  evidenceReference?: string;
  permitExpiresAt?: string;
  categorySwitches?: Record<string, boolean>;
  centerLatitude: number;
  centerLongitude: number;
}

export interface UpdateServiceCityRequest {
  name?: string;
  operationalStatus?: CityOperationalStatus;
  evidenceReference?: string;
  permitExpiresAt?: string;
  categorySwitches?: Record<string, boolean>;
  centerLatitude?: number;
  centerLongitude?: number;
}

export interface CreateServiceZoneRequest {
  code: string;
  name: string;
  city: string;
  operationalStatus?: ZoneOperationalStatus;
  evidenceReference?: string;
  permitExpiresAt?: string;
  categorySwitches?: Record<string, boolean>;
  boundary: GeoJsonPolygon;
  centerLatitude?: number;
  centerLongitude?: number;
}

export interface UpdateServiceZoneRequest {
  name?: string;
  operationalStatus?: ZoneOperationalStatus;
  evidenceReference?: string;
  permitExpiresAt?: string;
  categorySwitches?: Record<string, boolean>;
  boundary?: GeoJsonPolygon;
  centerLatitude?: number;
  centerLongitude?: number;
  isActive?: boolean;
}

export interface ToggleCategorySwitchRequest {
  serviceCategory: string;
  isEnabled: boolean;
  evidenceReference?: string;
}
