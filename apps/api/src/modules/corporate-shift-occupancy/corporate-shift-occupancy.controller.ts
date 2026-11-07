import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CorporateShiftOccupancyService } from './corporate-shift-occupancy.service';
import { ReconcileManifestRequest, RouteOccupancySummary } from '@ecoride/contracts';

@Controller('v1/corporate-shuttle')
export class CorporateShiftOccupancyController {
  constructor(private readonly occupancyService: CorporateShiftOccupancyService) {}

  @Post('manifest/reconcile')
  async reconcileManifest(@Body() body: ReconcileManifestRequest): Promise<RouteOccupancySummary> {
    return this.occupancyService.reconcileManifest(body);
  }

  @Get('manifest/:manifestId/occupancy')
  async getOccupancySummary(@Param('manifestId') manifestId: string): Promise<RouteOccupancySummary> {
    return this.occupancyService.getOccupancySummary(manifestId);
  }
}
