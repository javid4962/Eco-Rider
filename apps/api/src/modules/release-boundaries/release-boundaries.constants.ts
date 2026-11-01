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
 * Authoritative Scope Matrix separating Pilot (Release A) from Future phases (B, C, D)
 * and establishing clear launch gates per category.
 */
export const RELEASE_SCOPE_MATRIX: ReleaseBoundaryScope[] = [
  {
    releasePhase: ReleasePhase.RELEASE_A,
    displayName: 'Release A - Private EV On-Demand',
    phaseType: PhaseType.PILOT,
    categories: [ServiceCategory.PRIVATE_EV],
    description:
      'Point-to-point on-demand commercial electric rides (e-Bikes, e-Autos, e-Cabs) in authorized pilot urban zones.',
    launchGates: [
      {
        id: 'GATE-A-01',
        name: 'AP Transport EV Pilot Authorization',
        description:
          'Regulatory clearance from AP State Transport Department for commercial green-plate EV rides.',
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
          'Minimum of 50 active commercial EVs in pilot corridors (e.g. Visakhapatnam-Anakapalle, Vijayawada-Guntur).',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-B-02',
        name: 'Seat Concurrency Lock Verification',
        description:
          'Real database-backed concurrency tests proving zero double-booking on simultaneous seat checkout.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-B-03',
        name: 'Municipal Virtual Stop Approvals',
        description:
          'Designated safe EV boarding/alighting points approved by local urban development authorities.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
    ],
  },
  {
    releasePhase: ReleasePhase.RELEASE_C,
    displayName: 'Release C - Passes & Guarantees',
    phaseType: PhaseType.FUTURE,
    categories: [ServiceCategory.COMMUTER_PASS, ServiceCategory.ON_TIME_GUARANTEE],
    description:
      'Prepaid recurring commute passes and SLA-backed punctuality guarantees with automatic delay credits.',
    launchGates: [
      {
        id: 'GATE-C-01',
        name: 'Regulatory Advance Funds Escrow',
        description:
          'Bank escrow trust mechanism compliant with prepaid payment instruments (PPI) regulations.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-C-02',
        name: '60-Day Route Reliability Telemetry',
        description:
          'Historical GPS and trip completion data showing >= 95% on-time arrival rate before offering guarantees.',
        isSatisfied: false,
        mandatoryForLaunch: true,
      },
      {
        id: 'GATE-C-03',
        name: 'Automated SLA Refund Ledger',
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
 * Initial Disabled Settings by City and Service
 * Follows Rule 3: Keep uncertain service types disabled by default.
 * Only Release A in the pilot city (Visakhapatnam) is enabled initially.
 */
export const INITIAL_CITY_SERVICE_SETTINGS: CityServiceSettingsMap = {
  [AndhraPradeshCity.VISAKHAPATNAM]: {
    [ServiceCategory.PRIVATE_EV]: {
      enabled: true,
      releasePhase: ReleasePhase.RELEASE_A,
    },
    [ServiceCategory.SCHEDULED_SHARING]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_B,
      blocker:
        'Launch Gate Pending: Corridor commercial fleet density and seat lock concurrency verification required.',
    },
    [ServiceCategory.COMMUTER_PASS]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker:
        'Launch Gate Pending: Escrow account compliance and prepaid pass entitlement rules required.',
    },
    [ServiceCategory.ON_TIME_GUARANTEE]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_C,
      blocker: 'Launch Gate Pending: 60-day historical route punctuality baseline >= 95% required.',
    },
    [ServiceCategory.FLEET_OPTIMIZATION]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_D,
      blocker:
        'Launch Gate Pending: CPO charging station API integration and battery telemetry required.',
    },
  },
  [AndhraPradeshCity.VIJAYAWADA]: {
    [ServiceCategory.PRIVATE_EV]: {
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_A,
      blocker:
        'Launch Gate Pending: Vijayawada municipal EV pilot permit and charging infrastructure readiness required.',
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
      enabled: false,
      releasePhase: ReleasePhase.RELEASE_A,
      blocker: 'Launch Gate Pending: Municipal EV permit approval required.',
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
      blocker: 'Launch Gate Pending: Municipal EV permit approval required.',
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
