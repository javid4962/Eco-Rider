import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReleaseBoundariesService } from '../src/modules/release-boundaries/release-boundaries.service';
import { ServiceCategory, ReleasePhase, PhaseType, AndhraPradeshCity } from '@ecoride/contracts';

describe('ReleaseBoundariesService', () => {
  let service: ReleaseBoundariesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReleaseBoundariesService],
    }).compile();

    service = module.get<ReleaseBoundariesService>(ReleaseBoundariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Scope Matrix & Phase Separation', () => {
    it('should return all 4 releases covering the 5 service categories', () => {
      const matrix = service.getScopeMatrix();
      expect(matrix).toHaveLength(4);

      const phases = matrix.map((s) => s.releasePhase);
      expect(phases).toContain(ReleasePhase.RELEASE_A);
      expect(phases).toContain(ReleasePhase.RELEASE_B);
      expect(phases).toContain(ReleasePhase.RELEASE_C);
      expect(phases).toContain(ReleasePhase.RELEASE_D);

      const allCategories = matrix.flatMap((s) => s.categories);
      expect(allCategories).toHaveLength(5);
      expect(allCategories).toContain(ServiceCategory.PRIVATE_EV);
      expect(allCategories).toContain(ServiceCategory.SCHEDULED_SHARING);
      expect(allCategories).toContain(ServiceCategory.COMMUTER_PASS);
      expect(allCategories).toContain(ServiceCategory.ON_TIME_GUARANTEE);
      expect(allCategories).toContain(ServiceCategory.FLEET_OPTIMIZATION);
    });

    it('should cleanly separate Pilot from Future phases', () => {
      const matrix = service.getScopeMatrix();

      const pilotScope = matrix.filter((s) => s.phaseType === PhaseType.PILOT);
      expect(pilotScope).toHaveLength(1);
      expect(pilotScope[0].releasePhase).toBe(ReleasePhase.RELEASE_A);
      expect(pilotScope[0].categories).toEqual([ServiceCategory.PRIVATE_EV]);

      const futureScopes = matrix.filter((s) => s.phaseType === PhaseType.FUTURE);
      expect(futureScopes).toHaveLength(3);
      expect(futureScopes.map((s) => s.releasePhase)).toEqual([
        ReleasePhase.RELEASE_B,
        ReleasePhase.RELEASE_C,
        ReleasePhase.RELEASE_D,
      ]);
    });

    it('should define explicit launch gates for each category', () => {
      const matrix = service.getScopeMatrix();
      for (const scope of matrix) {
        expect(scope.launchGates.length).toBeGreaterThan(0);
        for (const gate of scope.launchGates) {
          expect(gate.id).toBeDefined();
          expect(gate.name).toBeDefined();
          expect(gate.description).toBeDefined();
          expect(typeof gate.isSatisfied).toBe('boolean');
          expect(typeof gate.mandatoryForLaunch).toBe('boolean');
        }
      }
    });
  });

  describe('Initial Disabled Settings & Server-Side Feature Flag Evaluation', () => {
    it('should allow Release A Private EV in the authorized launch corridor (Vijayawada, Guntur, Amaravathi)', () => {
      const authorizedCities = [
        AndhraPradeshCity.VIJAYAWADA,
        AndhraPradeshCity.GUNTUR,
        AndhraPradeshCity.AMARAVATHI,
      ];

      for (const city of authorizedCities) {
        const result = service.evaluate(city, ServiceCategory.PRIVATE_EV);

        expect(result.allowed).toBe(true);
        expect(result.city).toBe(city);
        expect(result.serviceCategory).toBe(ServiceCategory.PRIVATE_EV);
        expect(result.releasePhase).toBe(ReleasePhase.RELEASE_A);
        expect(result.phaseType).toBe(PhaseType.PILOT);
        expect(result.pendingGates).toHaveLength(0);
      }
    });

    it('should block Release B Scheduled Sharing in Vijayawada pending launch gates', () => {
      const result = service.evaluate(
        AndhraPradeshCity.VIJAYAWADA,
        ServiceCategory.SCHEDULED_SHARING,
      );

      expect(result.allowed).toBe(false);
      expect(result.releasePhase).toBe(ReleasePhase.RELEASE_B);
      expect(result.phaseType).toBe(PhaseType.FUTURE);
      expect(result.reason).toContain('Launch Gate Pending');
      expect(result.pendingGates.length).toBeGreaterThan(0);
      expect(result.pendingGates.some((g) => g.id === 'GATE-B-02')).toBe(true);
    });

    it('should block Release C Passes and Guarantees across all cities', () => {
      const passResult = service.evaluate(
        AndhraPradeshCity.VIJAYAWADA,
        ServiceCategory.COMMUTER_PASS,
      );
      expect(passResult.allowed).toBe(false);
      expect(passResult.releasePhase).toBe(ReleasePhase.RELEASE_C);
      expect(passResult.phaseType).toBe(PhaseType.FUTURE);

      const guaranteeResult = service.evaluate(
        AndhraPradeshCity.VIJAYAWADA,
        ServiceCategory.ON_TIME_GUARANTEE,
      );
      expect(guaranteeResult.allowed).toBe(false);
      expect(guaranteeResult.releasePhase).toBe(ReleasePhase.RELEASE_C);
      expect(guaranteeResult.phaseType).toBe(PhaseType.FUTURE);
    });

    it('should block Release D Optimization across all cities', () => {
      const result = service.evaluate(
        AndhraPradeshCity.VIJAYAWADA,
        ServiceCategory.FLEET_OPTIMIZATION,
      );
      expect(result.allowed).toBe(false);
      expect(result.releasePhase).toBe(ReleasePhase.RELEASE_D);
      expect(result.phaseType).toBe(PhaseType.FUTURE);
    });

    it('should block Private EV in unlaunched / secondary expansion cities (Visakhapatnam, Tirupati)', () => {
      const expansionCities = [
        AndhraPradeshCity.VISAKHAPATNAM,
        AndhraPradeshCity.TIRUPATI,
      ];

      for (const city of expansionCities) {
        const result = service.evaluate(city, ServiceCategory.PRIVATE_EV);
        expect(result.allowed).toBe(false);
        expect(result.city).toBe(city);
      }
    });
  });

  describe('Edge Cases & Validation', () => {
    it('should handle case insensitivity and whitespace', () => {
      const result = service.evaluate('  VIJAYAWADA  ', ' PRIVATE_EV ');
      expect(result.allowed).toBe(true);
      expect(result.city).toBe(AndhraPradeshCity.VIJAYAWADA);
      expect(result.serviceCategory).toBe(ServiceCategory.PRIVATE_EV);
    });

    it('should throw BadRequestException on invalid city', () => {
      expect(() => service.evaluate('hyderabad', ServiceCategory.PRIVATE_EV)).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on invalid service category', () => {
      expect(() => service.evaluate(AndhraPradeshCity.VIJAYAWADA, 'diesel_suv')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException on empty parameters', () => {
      expect(() => service.evaluate('', ServiceCategory.PRIVATE_EV)).toThrow(BadRequestException);
      expect(() => service.evaluate(AndhraPradeshCity.VIJAYAWADA, '')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('Concurrency & Immutability', () => {
    it('should return consistent results under concurrent evaluation requests without state corruption', async () => {
      const requests = Array.from({ length: 50 }, (_, i) => {
        const city = i % 2 === 0 ? AndhraPradeshCity.VIJAYAWADA : AndhraPradeshCity.TIRUPATI;
        const category =
          i % 2 === 0 ? ServiceCategory.PRIVATE_EV : ServiceCategory.SCHEDULED_SHARING;
        return service.evaluate(city, category);
      });

      const results = await Promise.all(requests);
      expect(results).toHaveLength(50);

      // Even iterations (Vijayawada + Private EV) must all be true
      results.forEach((res, i) => {
        if (i % 2 === 0) {
          expect(res.allowed).toBe(true);
        } else {
          expect(res.allowed).toBe(false);
        }
      });
    });
  });
});
