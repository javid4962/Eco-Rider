/**
 * EcoRide EV Charging Aggregator & Fleet Battery Telemetry Contracts (EV-121 – EV-125)
 * Charging station directory in AP Capital Corridor (Vijayawada, Guntur, Amaravathi, Mangalagiri),
 * fast DC/CCS2 connectors, en-route reservation, telemetry ingestion,
 * automated low-battery dispatch lockout, and session tariff settlement.
 */

export enum ChargingConnectorType {
  CCS2 = 'CCS2',                 // DC Fast charging up to 350kW (4W EVs)
  BHARAT_DC_001 = 'BHARAT_DC_001', // DC Fast charging 15kW - 30kW (3W e-loaders & light 4W)
  TYPE_2_AC = 'TYPE_2_AC',       // AC charging 7.4kW - 22kW (2W, 3W, 4W)
  GB_T = 'GB_T',                 // Heavy commercial DC standard
  BATTERY_SWAP = 'BATTERY_SWAP', // 2W/3W smart swap station
}

export enum ChargingStationStatus {
  OPERATIONAL = 'OPERATIONAL',
  DEGRADED = 'DEGRADED',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum ChargingReservationStatus {
  RESERVED = 'RESERVED',
  CHARGING = 'CHARGING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface ChargingStationDto {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  operator: string;
  totalGuns: number;
  availableGuns: number;
  supportedConnectors: ChargingConnectorType[];
  maxPowerKw: number;
  tariffPerKwhPaise: number;
  formattedTariff: string;
  status: ChargingStationStatus;
  amenities: string[];
  isActive: boolean;
}

export interface NearbyChargerQueryDto {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  connectorType?: ChargingConnectorType;
  minPowerKw?: number;
}

export interface CreateChargingReservationDto {
  stationId: string;
  vehicleId: string;
  connectorType: ChargingConnectorType;
}

export interface ChargingReservationDto {
  id: string;
  stationId: string;
  stationName: string;
  captainId: string;
  vehicleId: string;
  connectorType: ChargingConnectorType;
  status: ChargingReservationStatus;
  reservedUntil: string;
  kwhConsumed?: number;
  tariffPerKwhPaise: number;
  energyFarePaise: number;
  gstPaise: number;
  totalFarePaise: number;
  formattedTotalFare: string;
  createdAt: string;
}

export interface CompleteChargingSessionDto {
  reservationId: string;
  kwhConsumed: number;
  endSocPercent: number;
}

export interface BatteryTelemetryReportDto {
  vehicleId: string;
  socPercent: number;
  estimatedRangeKm?: number;
  source: string;
  batteryTemperatureC?: number;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface BatteryTelemetryResponseDto {
  vehicleId: string;
  socPercent: number;
  estimatedRangeKm: number;
  isDispatchEligible: boolean;
  isLockoutActive: boolean;
  lockoutReason?: string;
  nearestCharger?: ChargingStationDto;
  recommendedAction: string;
}

/**
 * Seeded Andhra Pradesh Capital Region EV Fast-Charging Hubs.
 * Located in Vijayawada, Guntur, Mangalagiri, and Amaravathi.
 */
export const AP_CAPITAL_CORRIDOR_CHARGERS: Omit<ChargingStationDto, 'distanceKm'>[] = [
  {
    id: 'chg-vja-benz-circle',
    name: 'NREDCAP Benz Circle Mega EV Station',
    code: 'VJA-BENZ-01',
    city: 'vijayawada',
    address: 'Near Benz Circle, MG Road, Vijayawada, AP 520010',
    latitude: 16.5062,
    longitude: 80.648,
    operator: 'NREDCAP AP EV Infrastructure',
    totalGuns: 8,
    availableGuns: 6,
    supportedConnectors: [
      ChargingConnectorType.CCS2,
      ChargingConnectorType.BHARAT_DC_001,
      ChargingConnectorType.TYPE_2_AC,
    ],
    maxPowerKw: 120,
    tariffPerKwhPaise: 1800, // ₹18.00 / kWh
    formattedTariff: '₹18.00/kWh',
    status: ChargingStationStatus.OPERATIONAL,
    amenities: ['RESTROOMS', 'CAFE', 'EV_SERVICE_BAY', 'WIFI'],
    isActive: true,
  },
  {
    id: 'chg-vja-pnbs',
    name: 'Pandit Nehru Bus Station (PNBS) EV Fast Hub',
    code: 'VJA-PNBS-02',
    city: 'vijayawada',
    address: 'APSRTC PNBS Terminal, Vijayawada, AP 520001',
    latitude: 16.5134,
    longitude: 80.6231,
    operator: 'APSRTC E-Bus & Fleet Depots',
    totalGuns: 12,
    availableGuns: 9,
    supportedConnectors: [
      ChargingConnectorType.CCS2,
      ChargingConnectorType.BHARAT_DC_001,
    ],
    maxPowerKw: 240,
    tariffPerKwhPaise: 1750, // ₹17.50 / kWh
    formattedTariff: '₹17.50/kWh',
    status: ChargingStationStatus.OPERATIONAL,
    amenities: ['RESTROOMS', 'WAITING_LOUNGE', 'WATER'],
    isActive: true,
  },
  {
    id: 'chg-mgl-aiims',
    name: 'Mangalagiri AIIMS Corridor Smart Fast Charger',
    code: 'MGL-AIIMS-03',
    city: 'mangalagiri',
    address: 'NH-16 AIIMS Junction, Mangalagiri, Guntur Dist, AP 522503',
    latitude: 16.4357,
    longitude: 80.5654,
    operator: 'EcoRide SuperCharge AP',
    totalGuns: 6,
    availableGuns: 5,
    supportedConnectors: [
      ChargingConnectorType.CCS2,
      ChargingConnectorType.TYPE_2_AC,
    ],
    maxPowerKw: 120,
    tariffPerKwhPaise: 1800,
    formattedTariff: '₹18.00/kWh',
    status: ChargingStationStatus.OPERATIONAL,
    amenities: ['RESTROOMS', 'CAFE', 'SECURITY_24X7'],
    isActive: true,
  },
  {
    id: 'chg-amv-secretariat',
    name: 'Amaravathi Secretariat Government Complex EV Depot',
    code: 'AMV-SEC-04',
    city: 'amaravathi',
    address: 'Block 1, AP Government Secretariat, Velagapudi, AP 522237',
    latitude: 16.5412,
    longitude: 80.5143,
    operator: 'APCRDA Smart City EV Infrastructure',
    totalGuns: 10,
    availableGuns: 8,
    supportedConnectors: [
      ChargingConnectorType.CCS2,
      ChargingConnectorType.BHARAT_DC_001,
      ChargingConnectorType.TYPE_2_AC,
    ],
    maxPowerKw: 150,
    tariffPerKwhPaise: 1650,
    formattedTariff: '₹16.50/kWh',
    status: ChargingStationStatus.OPERATIONAL,
    amenities: ['RESTROOMS', 'SOLAR_CANOPY', 'SECURITY_24X7'],
    isActive: true,
  },
  {
    id: 'chg-gtr-arundelpet',
    name: 'Guntur Arundelpet Central EV Charging Station',
    code: 'GTR-ARU-05',
    city: 'guntur',
    address: 'Near Old Bus Stand, Arundelpet, Guntur, AP 522002',
    latitude: 16.3067,
    longitude: 80.4365,
    operator: 'NREDCAP AP EV Infrastructure',
    totalGuns: 8,
    availableGuns: 7,
    supportedConnectors: [
      ChargingConnectorType.CCS2,
      ChargingConnectorType.BHARAT_DC_001,
      ChargingConnectorType.TYPE_2_AC,
    ],
    maxPowerKw: 60,
    tariffPerKwhPaise: 1800,
    formattedTariff: '₹18.00/kWh',
    status: ChargingStationStatus.OPERATIONAL,
    amenities: ['RESTROOMS', 'MARKET_ACCESS'],
    isActive: true,
  },
];
