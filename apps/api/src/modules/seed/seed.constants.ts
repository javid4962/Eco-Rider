export interface SyntheticUserSeed {
  id: string;
  phone: string;
  role: 'RIDER' | 'CAPTAIN' | 'DISPATCHER' | 'FLEET_OWNER' | 'FINANCE_ADMIN' | 'SAFETY_OFFICER' | 'INSTITUTION_REP';
  name: string;
  isActive: boolean;
}

export interface SyntheticVehicleSeed {
  id: string;
  registrationNumber: string;
  propulsionType: 'BATTERY_ELECTRIC';
  batteryCapacityKwh: number;
  currentSocPercent: number;
  vehicleCategory: string;
  isActive: boolean;
}

export interface SyntheticZoneSeed {
  id: string;
  city: string;
  name: string;
  coordinates: Array<[number, number]>; // [longitude, latitude] for GeoJSON Polygon
  isActive: boolean;
}

export interface SyntheticBookingSeed {
  id: string;
  bookingCode: string;
  riderId: string;
  captainId: string;
  vehicleId: string;
  serviceCategory: string;
  status: string;
  pickupLongitude: number;
  pickupLatitude: number;
  dropoffLongitude: number;
  dropoffLatitude: number;
  startOtp?: string;
  fareAmount: number;
}

export interface SyntheticLedgerEntrySeed {
  id: string;
  idempotencyKey: string;
  bookingId: string;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amountPaise: number;
  currency: 'INR';
  description: string;
}

export interface SyntheticServiceFlagSeed {
  id: string;
  city: string;
  serviceCategory: string;
  isEnabled: boolean;
  releasePhase: string;
  blockerReason?: string;
}

// Canonical static UUIDs for repeatable seed idempotency
export const SEED_USERS: SyntheticUserSeed[] = [
  // 1. Riders
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    phone: '+919123400001',
    role: 'RIDER',
    name: 'Kavya Sharma (Demo Rider)',
    isActive: true,
  },
  {
    id: 'a0000001-0000-0000-0000-000000000002',
    phone: '+919123400002',
    role: 'RIDER',
    name: 'Ravi Teja (Demo Rider)',
    isActive: true,
  },
  {
    id: 'a0000001-0000-0000-0000-000000000003',
    phone: '+919123400003',
    role: 'RIDER',
    name: 'Priya Reddy (Demo Rider)',
    isActive: true,
  },
  // 2. Captains (EV Drivers)
  {
    id: 'b0000001-0000-0000-0000-000000000011',
    phone: '+919123400011',
    role: 'CAPTAIN',
    name: 'Srinivas Rao (Demo Captain - e-Bike)',
    isActive: true,
  },
  {
    id: 'b0000001-0000-0000-0000-000000000012',
    phone: '+919123400012',
    role: 'CAPTAIN',
    name: 'Manoj Kumar (Demo Captain - e-Auto)',
    isActive: true,
  },
  {
    id: 'b0000001-0000-0000-0000-000000000013',
    phone: '+919123400013',
    role: 'CAPTAIN',
    name: 'Lakshmi Narayana (Demo Captain - e-Cab)',
    isActive: true,
  },
  // 3. Operational Staff (EV-004 Roles)
  {
    id: 'c0000001-0000-0000-0000-000000000021',
    phone: '+919123400021',
    role: 'DISPATCHER',
    name: 'Anil Varma (Vizag Operations Hub Dispatcher)',
    isActive: true,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000031',
    phone: '+919123400031',
    role: 'FLEET_OWNER',
    name: 'Vizag Green Mobility Partners (Demo Fleet Owner)',
    isActive: true,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000041',
    phone: '+919123400041',
    role: 'FINANCE_ADMIN',
    name: 'Sunita Naidu (Finance & Escrow Admin)',
    isActive: true,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000051',
    phone: '+919123400051',
    role: 'SAFETY_OFFICER',
    name: 'Kiran Kumar (24x7 Safety & SOS Response Officer)',
    isActive: true,
  },
  {
    id: 'c0000001-0000-0000-0000-000000000061',
    phone: '+919123400061',
    role: 'INSTITUTION_REP',
    name: 'Andhra University Corporate Mobility Coordinator',
    isActive: true,
  },
];

export const SEED_VEHICLES: SyntheticVehicleSeed[] = [
  // Ather 450X 2W e-Bike
  {
    id: 'd0000001-0000-0000-0000-000000000001',
    registrationNumber: 'AP-31-EV-0001',
    propulsionType: 'BATTERY_ELECTRIC',
    batteryCapacityKwh: 3.7,
    currentSocPercent: 88.0,
    vehicleCategory: 'CITY_COMMUTE_2W',
    isActive: true,
  },
  // Ola S1 Pro 2W e-Bike
  {
    id: 'd0000001-0000-0000-0000-000000000002',
    registrationNumber: 'AP-31-EV-0002',
    propulsionType: 'BATTERY_ELECTRIC',
    batteryCapacityKwh: 4.0,
    currentSocPercent: 92.5,
    vehicleCategory: 'CITY_COMMUTE_2W',
    isActive: true,
  },
  // Mahindra Treo 3W e-Auto
  {
    id: 'd0000001-0000-0000-0000-000000000011',
    registrationNumber: 'AP-31-EV-1001',
    propulsionType: 'BATTERY_ELECTRIC',
    batteryCapacityKwh: 7.37,
    currentSocPercent: 78.0,
    vehicleCategory: 'CITY_COMMUTE_3W',
    isActive: true,
  },
  // Tata Nexon EV 4W e-Cab
  {
    id: 'd0000001-0000-0000-0000-000000000021',
    registrationNumber: 'AP-31-EV-2001',
    propulsionType: 'BATTERY_ELECTRIC',
    batteryCapacityKwh: 40.5,
    currentSocPercent: 82.0,
    vehicleCategory: 'PRIVATE_EV_4W',
    isActive: true,
  },
  // Olectra e-Bus / Shuttle (Release B ready)
  {
    id: 'd0000001-0000-0000-0000-000000000031',
    registrationNumber: 'AP-31-EV-4001',
    propulsionType: 'BATTERY_ELECTRIC',
    batteryCapacityKwh: 120.0,
    currentSocPercent: 95.0,
    vehicleCategory: 'SHARED_SHUTTLE_4W',
    isActive: true,
  },
];

export const SEED_ZONES: SyntheticZoneSeed[] = [
  // Visakhapatnam Beach Road & MVP Colony Polygon
  {
    id: 'e0000001-0000-0000-0000-000000000001',
    city: 'visakhapatnam',
    name: 'MVP Colony & Beach Corridor',
    coordinates: [
      [83.3100, 17.7000],
      [83.3500, 17.7000],
      [83.3600, 17.7600],
      [83.3200, 17.7600],
      [83.3100, 17.7000],
    ],
    isActive: true,
  },
  // Visakhapatnam Dwaraka Nagar & Railway Junction Polygon
  {
    id: 'e0000001-0000-0000-0000-000000000002',
    city: 'visakhapatnam',
    name: 'Dwaraka Nagar & RTC Complex Central Zone',
    coordinates: [
      [83.2800, 17.7100],
      [83.3150, 17.7100],
      [83.3150, 17.7400],
      [83.2800, 17.7400],
      [83.2800, 17.7100],
    ],
    isActive: true,
  },
  // Visakhapatnam Rushikonda IT SEZ Polygon
  {
    id: 'e0000001-0000-0000-0000-000000000003',
    city: 'visakhapatnam',
    name: 'Rushikonda IT SEZ Zone',
    coordinates: [
      [83.3600, 17.7650],
      [83.4000, 17.7650],
      [83.4000, 17.8100],
      [83.3600, 17.8100],
      [83.3600, 17.7650],
    ],
    isActive: true,
  },
  // Vijayawada Benz Circle Polygon (Disabled in Pilot)
  {
    id: 'e0000001-0000-0000-0000-000000000011',
    city: 'vijayawada',
    name: 'Benz Circle & MG Road Corridor',
    coordinates: [
      [80.6200, 16.4800],
      [80.6800, 16.4800],
      [80.6800, 16.5300],
      [80.6200, 16.5300],
      [80.6200, 16.4800],
    ],
    isActive: false,
  },
];

export const SEED_SERVICE_FLAGS: SyntheticServiceFlagSeed[] = [
  {
    id: 'f0000001-0000-0000-0000-000000000001',
    city: 'visakhapatnam',
    serviceCategory: 'private_ev',
    isEnabled: true,
    releasePhase: 'RELEASE_A',
    blockerReason: undefined,
  },
  {
    id: 'f0000001-0000-0000-0000-000000000002',
    city: 'visakhapatnam',
    serviceCategory: 'scheduled_sharing',
    isEnabled: false,
    releasePhase: 'RELEASE_B',
    blockerReason: 'Pending municipal virtual stop approvals (GATE-B-01)',
  },
  {
    id: 'f0000001-0000-0000-0000-000000000003',
    city: 'visakhapatnam',
    serviceCategory: 'commuter_pass',
    isEnabled: false,
    releasePhase: 'RELEASE_C',
    blockerReason: 'Pending RBI PPI escrow trust audit (GATE-C-01)',
  },
  {
    id: 'f0000001-0000-0000-0000-000000000011',
    city: 'vijayawada',
    serviceCategory: 'private_ev',
    isEnabled: false,
    releasePhase: 'RELEASE_A',
    blockerReason: 'Vijayawada commercial green-plate pilot permit pending (GATE-A-01)',
  },
  {
    id: 'f0000001-0000-0000-0000-000000000021',
    city: 'guntur',
    serviceCategory: 'private_ev',
    isEnabled: false,
    releasePhase: 'RELEASE_A',
    blockerReason: 'Guntur commercial green-plate pilot permit pending (GATE-A-01)',
  },
  {
    id: 'f0000001-0000-0000-0000-000000000031',
    city: 'tirupati',
    serviceCategory: 'private_ev',
    isEnabled: false,
    releasePhase: 'RELEASE_A',
    blockerReason: 'Tirupati commercial green-plate pilot permit pending (GATE-A-01)',
  },
];

export const SEED_BOOKINGS: SyntheticBookingSeed[] = [
  // 1. Completed demo ride with double-entry ledger entries
  {
    id: 'b1000001-0000-0000-0000-000000000001',
    bookingCode: 'BK-VIZAG-001',
    riderId: 'a0000001-0000-0000-0000-000000000001', // Kavya Sharma
    captainId: 'b0000001-0000-0000-0000-000000000011', // Srinivas Rao
    vehicleId: 'd0000001-0000-0000-0000-000000000001', // AP-31-EV-0001
    serviceCategory: 'CITY_COMMUTE_2W',
    status: 'COMPLETED',
    pickupLongitude: 83.3038,
    pickupLatitude: 17.7275, // Dwaraka Nagar RTC Complex
    dropoffLongitude: 83.3235,
    dropoffLatitude: 17.7142, // RK Beach
    fareAmount: 85.0, // ₹85.00 = 8500 paise
  },
  // 2. Active in-progress demo ride with OTP
  {
    id: 'b1000001-0000-0000-0000-000000000002',
    bookingCode: 'BK-VIZAG-002',
    riderId: 'a0000001-0000-0000-0000-000000000002', // Ravi Teja
    captainId: 'b0000001-0000-0000-0000-000000000012', // Manoj Kumar
    vehicleId: 'd0000001-0000-0000-0000-000000000011', // AP-31-EV-1001
    serviceCategory: 'CITY_COMMUTE_3W',
    status: 'IN_PROGRESS',
    pickupLongitude: 83.2906,
    pickupLatitude: 17.7215, // Vizag Station
    dropoffLongitude: 83.3371,
    dropoffLatitude: 17.7412, // MVP Colony
    startOtp: '4821',
    fareAmount: 120.0,
  },
  // 3. Confirmed demo ride awaiting pickup
  {
    id: 'b1000001-0000-0000-0000-000000000003',
    bookingCode: 'BK-VIZAG-003',
    riderId: 'a0000001-0000-0000-0000-000000000003', // Priya Reddy
    captainId: 'b0000001-0000-0000-0000-000000000013', // Lakshmi Narayana
    vehicleId: 'd0000001-0000-0000-0000-000000000021', // AP-31-EV-2001
    serviceCategory: 'PRIVATE_EV_4W',
    status: 'CONFIRMED',
    pickupLongitude: 83.3371,
    pickupLatitude: 17.7412, // MVP Colony
    dropoffLongitude: 83.3776,
    dropoffLatitude: 17.7818, // Rushikonda IT SEZ
    startOtp: '7394',
    fareAmount: 250.0,
  },
];

export const SEED_LEDGER_ENTRIES: SyntheticLedgerEntrySeed[] = [
  // Balanced double entry for BK-VIZAG-001 (Total ₹85.00 = 8500 paise)
  // DEBIT: Rider Escrow Account (8500 paise)
  {
    id: '1e000001-0000-0000-0000-000000000001',
    idempotencyKey: 'idemp_ledger_b1000001_debit_escrow',
    bookingId: 'b1000001-0000-0000-0000-000000000001',
    accountId: 'ACC_ESCROW_RIDER_01',
    entryType: 'DEBIT',
    amountPaise: 8500,
    currency: 'INR',
    description: 'Ride fare debit from rider escrow for completed ride BK-VIZAG-001',
  },
  // CREDIT: Captain Earnings Account (80% = 6800 paise)
  {
    id: '1e000001-0000-0000-0000-000000000002',
    idempotencyKey: 'idemp_ledger_b1000001_credit_captain',
    bookingId: 'b1000001-0000-0000-0000-000000000001',
    accountId: 'ACC_CAPTAIN_EARNINGS_01',
    entryType: 'CREDIT',
    amountPaise: 6800,
    currency: 'INR',
    description: '80% Captain earnings payout credit for ride BK-VIZAG-001',
  },
  // CREDIT: Platform Commission Account (20% = 1700 paise)
  {
    id: '1e000001-0000-0000-0000-000000000003',
    idempotencyKey: 'idemp_ledger_b1000001_credit_platform',
    bookingId: 'b1000001-0000-0000-0000-000000000001',
    accountId: 'ACC_PLATFORM_COMMISSION',
    entryType: 'CREDIT',
    amountPaise: 1700,
    currency: 'INR',
    description: '20% Platform operational commission credit for ride BK-VIZAG-001',
  },
];
