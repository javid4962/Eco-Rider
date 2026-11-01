import { Controller, Get, Query } from '@nestjs/common';
import { ReleaseBoundariesService } from './release-boundaries.service';
import {
  ReleaseBoundaryScope,
  ServiceEvaluationResult,
} from '@ecoride/contracts';
import { CityServiceSettingsMap } from './release-boundaries.constants';

@Controller('release-boundaries')
export class ReleaseBoundariesController {
  constructor(
    private readonly releaseBoundariesService: ReleaseBoundariesService
  ) {}

  @Get('matrix')
  getScopeMatrix(): { scopes: readonly ReleaseBoundaryScope[] } {
    return {
      scopes: this.releaseBoundariesService.getScopeMatrix(),
    };
  }

  @Get('settings')
  getSettings(): { settings: CityServiceSettingsMap } {
    return {
      settings: this.releaseBoundariesService.getSettings(),
    };
  }

  @Get('check')
  checkServiceAccess(
    @Query('city') city: string,
    @Query('service') service: string
  ): ServiceEvaluationResult {
    return this.releaseBoundariesService.evaluate(city, service);
  }
}
