import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  ServiceCategory,
  ReleasePhase,
  PhaseType,
  AndhraPradeshCity,
  ReleaseBoundaryScope,
  ServiceEvaluationResult,
  LaunchGate,
} from '@ecoride/contracts';
import {
  RELEASE_SCOPE_MATRIX,
  INITIAL_CITY_SERVICE_SETTINGS,
  CityServiceSettingsMap,
} from './release-boundaries.constants';

@Injectable()
export class ReleaseBoundariesService {
  private readonly logger = new Logger(ReleaseBoundariesService.name);
  private readonly matrix: readonly ReleaseBoundaryScope[] = RELEASE_SCOPE_MATRIX;
  private readonly settings: CityServiceSettingsMap = INITIAL_CITY_SERVICE_SETTINGS;

  /**
   * Returns the complete release scope matrix separating Pilot from Future phases.
   */
  getScopeMatrix(): readonly ReleaseBoundaryScope[] {
    return this.matrix;
  }

  /**
   * Returns the initial city-by-service feature flags matrix.
   */
  getSettings(): CityServiceSettingsMap {
    return this.settings;
  }

  /**
   * Evaluates server-side whether a specific EV service category is permitted in a given city.
   *
   * @param cityRaw Candidate city name (e.g. 'visakhapatnam', 'tirupati')
   * @param serviceRaw Requested service category (e.g. 'private_ev', 'scheduled_sharing')
   * @returns ServiceEvaluationResult detailing authorization, phase, and launch gates
   */
  evaluate(cityRaw: string, serviceRaw: string): ServiceEvaluationResult {
    const city = this.validateCity(cityRaw);
    const serviceCategory = this.validateService(serviceRaw);

    const citySettings = this.settings[city];
    const serviceConfig = citySettings[serviceCategory];

    const releaseScope = this.findReleaseScope(serviceCategory);
    const pendingGates = releaseScope.launchGates.filter(
      (gate: LaunchGate) => gate.mandatoryForLaunch && !gate.isSatisfied,
    );

    if (!serviceConfig.enabled) {
      this.logger.warn(
        `Access denied: Service '${serviceCategory}' is disabled for city '${city}'. Reason: ${
          serviceConfig.blocker || 'Launch gate pending.'
        }`,
      );

      return {
        allowed: false,
        city,
        serviceCategory,
        releasePhase: releaseScope.releasePhase,
        phaseType: releaseScope.phaseType,
        reason: serviceConfig.blocker || 'Service is not active in this region.',
        pendingGates,
      };
    }

    // Even if configured as enabled, verify that all mandatory launch gates are satisfied
    if (pendingGates.length > 0) {
      this.logger.error(
        `Safety block: Service '${serviceCategory}' marked enabled but has unsatisfied mandatory launch gates.`,
      );
      return {
        allowed: false,
        city,
        serviceCategory,
        releasePhase: releaseScope.releasePhase,
        phaseType: releaseScope.phaseType,
        reason: 'Service cannot be launched until all mandatory launch gates are satisfied.',
        pendingGates,
      };
    }

    return {
      allowed: true,
      city,
      serviceCategory,
      releasePhase: releaseScope.releasePhase,
      phaseType: releaseScope.phaseType,
      pendingGates: [],
    };
  }

  private validateCity(cityRaw: string): AndhraPradeshCity {
    if (!cityRaw) {
      throw new BadRequestException('City parameter is required.');
    }
    const normalized = cityRaw.trim().toLowerCase();
    const validCities = Object.values(AndhraPradeshCity) as string[];
    if (!validCities.includes(normalized)) {
      throw new BadRequestException(
        `Invalid city '${cityRaw}'. Authorized Andhra Pradesh cities: ${validCities.join(', ')}.`,
      );
    }
    return normalized as AndhraPradeshCity;
  }

  private validateService(serviceRaw: string): ServiceCategory {
    if (!serviceRaw) {
      throw new BadRequestException('Service parameter is required.');
    }
    const normalized = serviceRaw.trim().toLowerCase();
    const validServices = Object.values(ServiceCategory) as string[];
    if (!validServices.includes(normalized)) {
      throw new BadRequestException(
        `Invalid service '${serviceRaw}'. Authorized service categories: ${validServices.join(', ')}.`,
      );
    }
    return normalized as ServiceCategory;
  }

  private findReleaseScope(serviceCategory: ServiceCategory): ReleaseBoundaryScope {
    const scope = this.matrix.find((s) => s.categories.includes(serviceCategory));
    if (!scope) {
      // Fallback safe definition
      return {
        releasePhase: ReleasePhase.RELEASE_D,
        displayName: 'Unclassified Service',
        phaseType: PhaseType.FUTURE,
        categories: [serviceCategory],
        description: 'Unclassified or experimental service',
        launchGates: [],
      };
    }
    return scope;
  }
}
