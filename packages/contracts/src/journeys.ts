export enum UserRole {
  RIDER = 'rider',
  CAPTAIN = 'captain',
  DISPATCHER = 'dispatcher',
  FLEET_OWNER = 'fleet_owner',
  FINANCE = 'finance',
  SAFETY = 'safety',
  INSTITUTION = 'institution',
}

export enum JourneyType {
  PRIVATE_RIDE = 'private_ride',
  SHARED_SEAT = 'shared_seat',
  PASS_REDEMPTION = 'pass_redemption',
  REFUND = 'refund',
  EMERGENCY = 'emergency',
}

export interface UserStory {
  id: string;
  role: UserRole;
  title: string;
  narrative: string;
  acceptanceCriteria: string[];
}

export interface JourneyStep {
  stepId: string;
  stateName: string;
  screenId: string;
  responsibleActor: UserRole;
  description: string;
  successPath: {
    action: string;
    nextState: string;
    nextScreenId: string;
  };
  emptyState: {
    condition: string;
    displayMessage: string;
    recoveryAction: string;
  };
  failurePath: {
    trigger: string;
    errorState: string;
    fallbackScreenId: string;
  };
}

export interface JourneyFlow {
  type: JourneyType;
  title: string;
  description: string;
  participatingRoles: UserRole[];
  initialState: string;
  initialScreenId: string;
  terminalStates: string[];
  steps: JourneyStep[];
}

export interface ScreenNode {
  screenId: string;
  displayName: string;
  role: UserRole;
  recoveryScreenId?: string;
}

export interface ScreenGraphValidationResult {
  valid: boolean;
  totalScreens: number;
  totalTransitions: number;
  orphanedScreens: string[];
}
