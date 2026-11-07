import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MultiStopTspRoutingService } from './multi-stop-tsp-routing.service';
import { EnergyOptimalTspRequest, EnergyOptimalTspRouteResult } from '@ecoride/contracts';

@Controller('v1/logistics-routing')
export class MultiStopTspRoutingController {
  constructor(private readonly tspRoutingService: MultiStopTspRoutingService) {}

  @Post('optimize-tsp')
  async optimizeTspRoute(@Body() body: EnergyOptimalTspRequest): Promise<EnergyOptimalTspRouteResult> {
    return this.tspRoutingService.optimizeTspRoute(body);
  }

  @Get('routes/:routeId')
  async getRoute(@Param('routeId') routeId: string): Promise<EnergyOptimalTspRouteResult> {
    return this.tspRoutingService.getRoute(routeId);
  }
}

