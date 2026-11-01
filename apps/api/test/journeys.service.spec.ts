import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JourneysService } from '../src/modules/journeys/journeys.service';
import { UserRole, JourneyType } from '@ecoride/contracts';

describe('JourneysService', () => {
  let service: JourneysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JourneysService],
    }).compile();

    service = module.get<JourneysService>(JourneysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('User Stories across 7 Platform Roles', () => {
    it('should define comprehensive user stories covering all 7 roles', () => {
      const stories = service.getAllUserStories();
      expect(stories.length).toBeGreaterThanOrEqual(7);

      const roles = new Set(stories.map((s) => s.role));
      expect(roles.has(UserRole.RIDER)).toBe(true);
      expect(roles.has(UserRole.CAPTAIN)).toBe(true);
      expect(roles.has(UserRole.DISPATCHER)).toBe(true);
      expect(roles.has(UserRole.FLEET_OWNER)).toBe(true);
      expect(roles.has(UserRole.FINANCE)).toBe(true);
      expect(roles.has(UserRole.SAFETY)).toBe(true);
      expect(roles.has(UserRole.INSTITUTION)).toBe(true);
    });

    it('should have complete narrative and acceptance criteria for each story', () => {
      const stories = service.getAllUserStories();
      for (const story of stories) {
        expect(story.id).toMatch(/^US-[A-Z]{3}-\d{2}$/);
        expect(story.title.length).toBeGreaterThan(5);
        expect(story.narrative).toContain('As a');
        expect(story.acceptanceCriteria.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should filter user stories by role', () => {
      const riderStories = service.getUserStoriesByRole(UserRole.RIDER);
      expect(riderStories.length).toBeGreaterThanOrEqual(1);
      expect(riderStories.every((s) => s.role === UserRole.RIDER)).toBe(true);

      const safetyStories = service.getUserStoriesByRole('SAFETY');
      expect(safetyStories.length).toBeGreaterThanOrEqual(1);
      expect(safetyStories.every((s) => s.role === UserRole.SAFETY)).toBe(true);
    });

    it('should throw BadRequestException on invalid role', () => {
      expect(() => service.getUserStoriesByRole('unknown_role')).toThrow(BadRequestException);
    });
  });

  describe('5 State-Oriented Journeys Completeness', () => {
    it('should provide all 5 required journey flows', () => {
      const flows = service.getAllJourneys();
      expect(flows).toHaveLength(5);

      const types = flows.map((f) => f.type);
      expect(types).toContain(JourneyType.PRIVATE_RIDE);
      expect(types).toContain(JourneyType.SHARED_SEAT);
      expect(types).toContain(JourneyType.PASS_REDEMPTION);
      expect(types).toContain(JourneyType.REFUND);
      expect(types).toContain(JourneyType.EMERGENCY);
    });

    it('should verify that every step in every journey has a success path, empty state, failure path, and responsible actor', () => {
      const flows = service.getAllJourneys();

      for (const flow of flows) {
        expect(flow.initialState).toBeDefined();
        expect(flow.initialScreenId).toBeDefined();
        expect(flow.terminalStates.length).toBeGreaterThanOrEqual(1);
        expect(flow.steps.length).toBeGreaterThanOrEqual(3);

        for (const step of flow.steps) {
          // Success Path
          expect(step.successPath).toBeDefined();
          expect(step.successPath.action.length).toBeGreaterThan(5);
          expect(step.successPath.nextState).toBeDefined();
          expect(step.successPath.nextScreenId).toMatch(/^SCR_/);

          // Empty State
          expect(step.emptyState).toBeDefined();
          expect(step.emptyState.condition.length).toBeGreaterThan(5);
          expect(step.emptyState.displayMessage.length).toBeGreaterThan(5);
          expect(step.emptyState.recoveryAction.length).toBeGreaterThan(5);

          // Failure Path
          expect(step.failurePath).toBeDefined();
          expect(step.failurePath.trigger.length).toBeGreaterThan(5);
          expect(step.failurePath.errorState).toBeDefined();
          expect(step.failurePath.fallbackScreenId).toMatch(/^SCR_/);

          // Responsible Actor
          expect(Object.values(UserRole)).toContain(step.responsibleActor);
        }
      }
    });

    it('should retrieve a single journey by type or throw on invalid type', () => {
      const privateRide = service.getJourneyByType('private_ride');
      expect(privateRide.type).toBe(JourneyType.PRIVATE_RIDE);

      expect(() => service.getJourneyByType('invalid_type')).toThrow(BadRequestException);
    });
  });

  describe('Screen Graph Connectivity & Zero Orphaned Screens', () => {
    it('should validate screen graph connectivity and assert ZERO orphaned screens', () => {
      const result = service.validateScreenGraph();

      expect(result.valid).toBe(true);
      expect(result.totalScreens).toBeGreaterThanOrEqual(30);
      expect(result.totalTransitions).toBeGreaterThanOrEqual(30);
      expect(result.orphanedScreens).toEqual([]);
    });
  });

  describe('State Transition & Actor Authority Validation', () => {
    it('should permit authorized actor to execute valid forward transition', () => {
      const result = service.validateTransition(
        JourneyType.PRIVATE_RIDE,
        'ARRIVED',
        'IN_TRANSIT',
        UserRole.CAPTAIN,
      );

      expect(result.valid).toBe(true);
    });

    it('should permit authorized actor to execute valid failure path transition', () => {
      const result = service.validateTransition(
        JourneyType.PRIVATE_RIDE,
        'ARRIVED',
        'OTP_FAILED',
        UserRole.CAPTAIN,
      );

      expect(result.valid).toBe(true);
    });

    it('should reject transition if unauthorized actor attempts execution', () => {
      const result = service.validateTransition(
        JourneyType.PRIVATE_RIDE,
        'ARRIVED',
        'IN_TRANSIT',
        UserRole.RIDER, // Rider cannot validate OTP and start ride meter
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not authorized');
      expect(result.reason).toContain(UserRole.CAPTAIN);
    });

    it('should reject illegal state skipping transition', () => {
      const result = service.validateTransition(
        JourneyType.PRIVATE_RIDE,
        'LOCATION_SEARCH',
        'TRIP_COMPLETED',
        UserRole.RIDER,
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Illegal state transition');
    });

    it('should reject non-existent state in journey', () => {
      const result = service.validateTransition(
        JourneyType.PRIVATE_RIDE,
        'UNKNOWN_STATE',
        'FARE_ESTIMATION',
        UserRole.RIDER,
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('does not exist');
    });
  });

  describe('Concurrency & State Immutability', () => {
    it('should handle concurrent transition validations and queries without corruption', async () => {
      const operations = Array.from({ length: 50 }, (_, i) => {
        if (i % 2 === 0) {
          return service.validateTransition(
            JourneyType.PRIVATE_RIDE,
            'ARRIVED',
            'IN_TRANSIT',
            UserRole.CAPTAIN,
          );
        } else {
          return service.validateTransition(
            JourneyType.PRIVATE_RIDE,
            'ARRIVED',
            'IN_TRANSIT',
            UserRole.RIDER,
          );
        }
      });

      const results = await Promise.all(operations);
      expect(results).toHaveLength(50);

      results.forEach((res, i) => {
        if (i % 2 === 0) {
          expect(res.valid).toBe(true);
        } else {
          expect(res.valid).toBe(false);
        }
      });
    });
  });
});
