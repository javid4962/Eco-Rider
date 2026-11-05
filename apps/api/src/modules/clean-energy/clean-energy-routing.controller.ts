import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CleanEnergyRoutingService } from './clean-energy-routing.service';
import {
  OptimalChargingDepotRecommendationDto,
  QueryOptimalDepotDto,
  DepotSolarGenerationDto,
} from '@ecoride/contracts';

@Controller('clean-energy')
export class CleanEnergyRoutingController {
  constructor(private readonly cleanEnergyService: CleanEnergyRoutingService) {}

  @Post('telemetry')
  @HttpCode(HttpStatus.CREATED)
  recordSolarTelemetry(@Body() dto: DepotSolarGenerationDto) {
    return this.cleanEnergyService.recordSolarTelemetry(dto);
  }

  @Post('optimal-depot')
  @HttpCode(HttpStatus.OK)
  findOptimalDepot(@Body() dto: QueryOptimalDepotDto): Promise<OptimalChargingDepotRecommendationDto> {
    return this.cleanEnergyService.findOptimalDepot(dto);
  }
}
