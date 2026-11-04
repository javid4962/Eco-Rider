import {
  ServiceCategory,
  ReleasePhase,
  PhaseType,
  AndhraPradeshCity,
  ReleaseBoundaryScope,
} from '@ecoride/contracts';

export interface CityServiceSetting {
  enabled: boolean;
  releasePhase: ReleasePhase;
  blocker?: string;
}

export type CityServiceSettingsMap = Record<
  AndhraPradeshCity,
  Record<ServiceCategory, CityServiceSetting>
>;

/**
 * Authoritative Scope Matrix separating Pilot/Launch (Release A) from Future phases (B, C, D)
 * and establishing clear launch gates per category.
 */
export const RELEASE_SCOPE_MATRIX: ReleaseBoundaryScope[] = [
  {
    releasePhase: ReleasePhase.RELEASE_A,
    displayName: 'Release A - Private EV On-Demand',
    phaseType: PhaseType.PILOT,
    categories: [ServiceCategory.PRIVATE_EV],
    description:
      'Point-to-point on-demand commercial electric rides (e-Bikes, e-Autos, e-Cabs) in authorized capital corridor urban zones.',
    launchGates: [
      {
        id: 'GATE-A-01',
        name: 'AP Transport EV Launch Corridor Authorization',
        description:
          'Regulatory clearance from AP State Transport Department for commercial green-plate EV rides in Guntur, Vijayawada, and Amaravathi.',
        isSatisfied: true,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-A-02',
        name: 'Captain KYC & Vehicle Green-Plate Audit',
        description:
          'Automated verification of driver commercial badge, clean background check, and 100% BEV registration.',
        isSatisfied: true,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-A-03',
        name: 'Battery Range Feasibility Guard',
        description:
          'Server-side rejection of ride dispatches if battery SoC is under 20% or insufficient for route distance.',
        isSatisfied: true,
        mandatoryForLaunch: true,
      },
    ],
  },
  {
    releasePhase: ReleasePhase.RELEASE_B,
    displayName: 'Release B - Scheduled EV Sharing & Pooling',
    phaseType: PhaseType.FUTURE,
    categories: [ServiceCategory.SCHEDULED_SHARING],
    description:
      'Fixed-route and corridor-based shared electric commutes with seat reservations along high-density corridors.',
    launchGates: [
      {
        id: 'GATE-B-01',
        name: 'Corridor EV Fleet Density',
        description:
          'Minimum of 50 active commercial EVs in pilot corridors (e.g. Vijayawada-Guntur-Amaravathi corridor).',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-B-02',
        name: 'Seat Concurrency Lock Proof',
        description:
          'Verified zero-overbooking concurrent seat reservation tests with database row-level locking.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-B-03',
        name: 'Virtual EV Stop Approvals',
        description:
          'City planning agency and AP-STA sign-off on designated virtual pickup/drop bays.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
    ],
  },
  {
    releasePhase: ReleasePhase.RELEASE_C,
    displayName: 'Release C - Passes & On-Time Arrival Guarantee',
    phaseType: PhaseType.FUTURE,
    categories: [ServiceCategory.COMMUTER_PASS, ServiceCategory.ON_TIME_GUARANTEE],
    description:
      'Prepaid subscription passes and SLA-backed on-time arrival guarantee with automated financial delay credit.',
    launchGates: [
      {
        id: 'GATE-C-01',
        name: 'Escrow Trust Account Setup',
        description:
          'Regulatory escrow trust account for prepaid rider funds per RBI Prepaid Payment Instruments guidelines.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-C-02',
        name: 'Route Reliability Telemetry Baseline',
        description:
          'At least 60 days of historical route telemetry demonstrating >= 95% on-time captain arrival rate.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-C-03',
        name: 'Automated SLA Delay Credit Ledger',
        description:
          'Idempotent financial ledger for automated credit issuance upon driver tardiness exceeding 10 minutes.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
    ],
  },
  {
    releasePhase: ReleasePhase.RELEASE_D,
    displayName: 'Release D - Fleet & Charging Optimization',
    phaseType: PhaseType.FUTURE,
    categories: [ServiceCategory.FLEET_OPTIMIZATION],
    description:
      'Smart charging depot scheduling, battery swapping station queue routing, and grid demand response integration.',
    launchGates: [
      {
        id: 'GATE-D-01',
        name: 'Charge Point Operator (CPO) API Integration',
        description:
          'Live OCPP 2.0.1 telemetry integration with public and private charging hubs across Andhra Pradesh.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-D-02',
        name: 'Battery Swapping Telemetry Feeds',
        description:
          'Real-time availability of charged battery packs at certified regional swapping kiosks.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-D-03',
        name: 'Time-of-Day (ToD) Tariff Optimization Model',
        description:
          'Dynamic routing of resting fleet vehicles to off-peak grid power tariffs to minimize operating costs.',
        isSatisfied: false,
        mandatoryForLaunch: false,
      },
    ],
  },
];

/**
 * Initial Settings by City and Service
 * Follows Rule 3: Keep unapproved regulated service types disabled by default.
 * In accordance with owner-approved 2026 scope, Guntur, Vijayawada, and Amaravathi
 * are the active launch corridor hubs for Release A Private EV.
 */
export const INITIAL_CITY_SERVICE_SETTINGS: CityServiceSettingsMap = {
  [AndhraPradeshCity.VIJAYAWADA]: {
    [ServiceCategory.PRIVATE_EV]: {
      enabled: true,
      releasePhase: ReleasePhase.RELEASE_A,
    },
    [ServiceCategory.SCHEDULED_SHARING]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_B,
      blocker:
        'Launch Gate Pending: Vijayawada-Guntur corridor density and municipal virtual stop approvals required.',
    },
    [ServiceCategory.COMMUTER_PASS]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Escrow account compliance required.',
    },
    [ServiceCategory.ON_TIME_GUARANTEE]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Historical route punctuality telemetry required.',
    },
    [ServiceCategory.FLEET_OPTIMIZATION]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_D,
      blocker: 'Launch Gate Pending: Charging depot API integration required.',
    },
  },
  [AndhraPradeshCity.GUNTUR]: {
    [ServiceCategory.PRIVATE_EV]: {
      enabled: true,
      releasePhase: ReleasePhase.RELEASE_A,
    },
    [ServiceCategory.SCHEDULED_SHARING]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_B,
      blocker: 'Launch Gate Pending: Corridor fleet density and virtual stop approvals required.',
    },
    [ServiceCategory.COMMUTER_PASS]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Escrow account compliance required.',
    },
    [ServiceCategory.ON_TIME_GUARANTEE]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Historical route punctuality telemetry required.',
    },
    [ServiceCategory.FLEET_OPTIMIZATION]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_D,
      blocker: 'Launch Gate Pending: Charging depot API integration required.',
    },
  },
  [AndhraPradeshCity.AMARAVATHI]: {
    [ServiceCategory.PRIVATE_EV]: {
      enabled: true,
      releasePhase: ReleasePhase.RELEASE_A,
    },
    [ServiceCategory.SCHEDULED_SHARING]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_B,
      blocker: 'Launch Gate Pending: Capital corridor density required.',
    },
    [ServiceCategory.COMMUTER_PASS]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Escrow account compliance required.',
    },
    [ServiceCategory.ON_TIME_GUARANTEE]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Historical route punctuality telemetry required.',
    },
    [ServiceCategory.FLEET_OPTIMIZATION]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_D,
      blocker: 'Launch Gate Pending: Charging depot API integration required.',
    },
  },
  [AndhraPradeshCity.VISAKHAPATNAM]: {
    [ServiceCategory.PRIVATE_EV]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_A,
      blocker:
        'De-prioritized: Guntur, Vijayawada, and Amaravathi constitute the official active launch corridor.',
    },
    [ServiceCategory.SCHEDULED_SHARING]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_B,
      blocker: 'Launch Gate Pending: Corridor density required.',
    },
    [ServiceCategory.COMMUTER_PASS]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Escrow account compliance required.',
    },
    [ServiceCategory.ON_TIME_GUARANTEE]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Historical route punctuality telemetry required.',
    },
    [ServiceCategory.FLEET_OPTIMIZATION]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_D,
      blocker: 'Launch Gate Pending: Charging depot API integration required.',
    },
  },
  [AndhraPradeshCity.TIRUPATI]: {
    [ServiceCategory.PRIVATE_EV]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_A,
      blocker: 'Launch Gate Pending: Secondary expansion phase approval required.',
    },
    [ServiceCategory.SCHEDULED_SHARING]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_B,
      blocker: 'Launch Gate Pending: Corridor density required.',
    },
    [ServiceCategory.COMMUTER_PASS]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Escrow account compliance required.',
    },
    [ServiceCategory.ON_TIME_GUARANTEE]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: Historical route punctuality telemetry required.',
    },
    [ServiceCategory.FLEET_OPTIMIZATION]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_D,
      blocker: 'Launch Gate Pending: Charging depot API integration required.',
    },
  },
};
