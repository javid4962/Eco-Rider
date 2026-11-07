import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { DepotGateAnprService } from './depot-gate-anpr.service';
import { GateScanRequest, DepotGateAccessRecord } from '@ecoride/contracts';

@Controller('v1/depot-gates')
export class DepotGateAnprController {
  constructor(private readonly anprService: DepotGateAnprService) {}

  @Post('scan-vehicle')
  async scanVehicle(@Body() body: GateScanRequest): Promise<DepotGateAccessRecord> {
    return this.anprService.scanVehicle(body);
  }

  @Get('logs/depot/:depotId')
  async getDepotLogs(@Param('depotId') depotId: string) {
    return this.anprService.getDepotLogs(depotId);
  }
}

