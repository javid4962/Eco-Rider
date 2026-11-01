export enum ServiceCategory {
  PRIVATE_EV = 'private_ev',
  SCHEDULED_SHARING = 'scheduled_sharing',
  COMMUTER_PASS = 'commuter_pass',
  ON_TIME_GUARANTEE = 'on_time_guarantee',
  FLEET_OPTIMIZATION = 'fleet_optimization',
}

export enum ReleasePhase {
  RELEASE_A = 'release_a',
  RELEASE_B = 'release_b',
  RELEASE_C = 'release_c',
  RELEASE_D = 'release_d',
}

export enum PhaseType {
  PILOT = 'PILOT',
  FUTURE = 'FUTURE',
}

export enum AndhraPradeshCity {
  VISAKHAPATNAM = 'visakhapatnam',
  VIJAYAWADA = 'vijayawada',
  GUNTUR = 'guntur',
  TIRUPATI = 'tirupati',
}

export interface LaunchGate {
  id: string;
  name: string;
  description: string;
  isSatisfied: boolean;
  mandatoryForLaunch: boolean;
}

export interface ReleaseBoundaryScope {
  releasePhase: ReleasePhase;
  displayName: string;
  phaseType: PhaseType;
  categories: ServiceCategory[];
  description: string;
  launchGates: LaunchGate[];
}

export interface ServiceEvaluationResult {
  allowed: boolean;
  city: AndhraPradeshCity;
  serviceCategory: ServiceCategory;
  releasePhase: ReleasePhase;
  phaseType: PhaseType;
  reason?: string;
  pendingGates: LaunchGate[];
}

