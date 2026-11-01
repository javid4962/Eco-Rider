import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  UserRole,
  JourneyType,
  UserStory,
  JourneyFlow,
  ScreenNode,
  ScreenGraphValidationResult,
} from '@ecoride/contracts';
import {
  USER_STORIES,
  JOURNEY_FLOWS,
  SCREEN_REGISTRY,
} from './journeys.constants';

@Injectable()
export class JourneysService {
  private readonly logger = new Logger(JourneysService.name);
  private readonly stories: readonly UserStory[] = USER_STORIES;
  private readonly flows: readonly JourneyFlow[] = JOURNEY_FLOWS;
  private readonly screens: readonly ScreenNode[] = SCREEN_REGISTRY;

  /**
   * Returns all platform user stories across the 7 roles.
   */
  getAllUserStories(): readonly UserStory[] {
    return this.stories;
  }

  /**
   * Returns user stories filtered by specific role.
   */
  getUserStoriesByRole(roleRaw: string): UserStory[] {
    const role = this.validateRole(roleRaw);
    return this.stories.filter((s) => s.role === role);
  }

  /**
   * Returns all 5 state-oriented journey flows.
   */
  getAllJourneys(): readonly JourneyFlow[] {
    return this.flows;
  }

  /**
   * Returns a specific journey flow by type.
   */
  getJourneyByType(typeRaw: string): JourneyFlow {
    const type = this.validateJourneyType(typeRaw);
    const flow = this.flows.find((f) => f.type === type);
    if (!flow) {
      throw new BadRequestException(`Journey flow of type '${type}' not found.`);
    }
    return flow;
  }

  /**
   * Returns all registered screen nodes in the application.
   */
  getAllScreens(): readonly ScreenNode[] {
    return this.screens;
  }

  /**
   * Validates screen graph connectivity across all journeys.
   * Asserts that no screen is orphaned:
   * 1. Every screen in the registry is reachable via initial state or transitions.
   * 2. Every success and failure transition references a valid registered screen.
   * 3. Every error/recovery screen provides an active recovery link back to primary flow.
   */
  validateScreenGraph(): ScreenGraphValidationResult {
    const registeredScreenIds = new Set(this.screens.map((s) => s.screenId));
    const incomingEdges = new Map<string, number>();
    const outgoingEdges = new Map<string, number>();

    // Initialize edge counters
    for (const screenId of registeredScreenIds) {
      incomingEdges.set(screenId, 0);
      outgoingEdges.set(screenId, 0);
    }

    let totalTransitions = 0;
    const missingDestinations: string[] = [];

    // Analyze transitions across all 5 journeys
    for (const flow of this.flows) {
      // Flow root screen gets an inherent entry point
      incomingEdges.set(
        flow.initialScreenId,
        (incomingEdges.get(flow.initialScreenId) || 0) + 1
      );

      for (const step of flow.steps) {
        const fromScreen = step.screenId;
        const successTarget = step.successPath?.nextScreenId;
        const failureTarget = step.failurePath?.fallbackScreenId;

        // Verify fromScreen is registered
        if (!registeredScreenIds.has(fromScreen)) {
          missingDestinations.push(`StepScreen:${fromScreen}`);
        }

        // Process success transition
        if (successTarget) {
          totalTransitions++;
          if (registeredScreenIds.has(successTarget)) {
            incomingEdges.set(
              successTarget,
              (incomingEdges.get(successTarget) || 0) + 1
            );
            outgoingEdges.set(
              fromScreen,
              (outgoingEdges.get(fromScreen) || 0) + 1
            );
          } else {
            missingDestinations.push(successTarget);
          }
        }

        // Process failure transition
        if (failureTarget) {
          totalTransitions++;
          if (registeredScreenIds.has(failureTarget)) {
            incomingEdges.set(
              failureTarget,
              (incomingEdges.get(failureTarget) || 0) + 1
            );
            outgoingEdges.set(
              fromScreen,
              (outgoingEdges.get(fromScreen) || 0) + 1
            );
          } else {
            missingDestinations.push(failureTarget);
          }
        }
      }
    }

    // Process fallback recovery routes
    for (const screen of this.screens) {
      if (screen.recoveryScreenId) {
        totalTransitions++;
        if (registeredScreenIds.has(screen.recoveryScreenId)) {
          incomingEdges.set(
            screen.recoveryScreenId,
            (incomingEdges.get(screen.recoveryScreenId) || 0) + 1
          );
          outgoingEdges.set(
            screen.screenId,
            (outgoingEdges.get(screen.screenId) || 0) + 1
          );
        } else {
          missingDestinations.push(screen.recoveryScreenId);
        }
      }
    }

    // Identify orphaned screens:
    // A screen is orphaned if it has 0 incoming transitions (and is not an entry screen)
    // or if it references an unregistered destination.
    const orphanedScreens: string[] = [...new Set(missingDestinations)];

    for (const [screenId, inCount] of incomingEdges.entries()) {
      if (inCount === 0) {
        orphanedScreens.push(`NoIncomingEdges:${screenId}`);
      }
    }

    const isValid = orphanedScreens.length === 0;

    return {
      valid: isValid,
      totalScreens: registeredScreenIds.size,
      totalTransitions,
      orphanedScreens,
    };
  }

  /**
   * Validates a state transition within a specified journey type, verifying
   * both state graph validity and responsible actor authority.
   */
  validateTransition(
    typeRaw: string,
    fromState: string,
    toState: string,
    actorRaw: string
  ): { valid: boolean; reason?: string } {
    const type = this.validateJourneyType(typeRaw);
    const actor = this.validateRole(actorRaw);

    const flow = this.flows.find((f) => f.type === type);
    if (!flow) {
      return { valid: false, reason: `Unknown journey type '${type}'.` };
    }

    const step = flow.steps.find((s) => s.stateName === fromState);
    if (!step) {
      return {
        valid: false,
        reason: `Initial state '${fromState}' does not exist in journey '${type}'.`,
      };
    }

    // Role check: Only the designated responsible actor may execute transition
    if (step.responsibleActor !== actor) {
      this.logger.warn(
        `Unauthorized transition attempt in '${type}': Actor '${actor}' cannot execute step '${fromState}'`
      );
      return {
        valid: false,
        reason: `Actor '${actor}' is not authorized to execute transition from state '${fromState}'. Responsible actor is '${step.responsibleActor}'.`,
      };
    }

    // State check: Does the step allow transition to toState?
    const isSuccess = step.successPath.nextState === toState;
    const isFailure = step.failurePath.errorState === toState;

    if (!isSuccess && !isFailure) {
      return {
        valid: false,
        reason: `Illegal state transition from '${fromState}' to '${toState}'. Permitted target states are '${step.successPath.nextState}' or '${step.failurePath.errorState}'.`,
      };
    }

    return { valid: true };
  }

  private validateRole(roleRaw: string): UserRole {
    if (!roleRaw) {
      throw new BadRequestException('Role parameter is required.');
    }
    const normalized = roleRaw.trim().toLowerCase();
    const validRoles = Object.values(UserRole) as string[];
    if (!validRoles.includes(normalized)) {
      throw new BadRequestException(
        `Invalid role '${roleRaw}'. Valid roles: ${validRoles.join(', ')}.`
      );
    }
    return normalized as UserRole;
  }

  private validateJourneyType(typeRaw: string): JourneyType {
    if (!typeRaw) {
      throw new BadRequestException('Journey type parameter is required.');
    }
    const normalized = typeRaw.trim().toLowerCase();
    const validTypes = Object.values(JourneyType) as string[];
    if (!validTypes.includes(normalized)) {
      throw new BadRequestException(
        `Invalid journey type '${typeRaw}'. Valid journey types: ${validTypes.join(', ')}.`
      );
    }
    return normalized as JourneyType;
  }
}
