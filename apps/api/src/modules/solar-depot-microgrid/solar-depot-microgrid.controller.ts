import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SolarDepotMicrogridService } from './solar-depot-microgrid.service';
import { SolarDepotMicrogridReading, MicrogridPeakShavingDispatch } from '@ecoride/contracts';

@Controller('v1/microgrid')
export class SolarDepotMicrogridController {
  constructor(private readonly microgridService: SolarDepotMicrogridService) {}

  @Post('dispatch')
  async dispatchPeakShaving(@Body() body: SolarDepotMicrogridReading): Promise<MicrogridPeakShavingDispatch> {
    return this.microgridService.dispatchPeakShaving(body);
  }

  @Get('events/depot/:depotId')
  async getDepotEvents(@Param('depotId') depotId: string) {
    return this.microgridService.getDepotEvents(depotId);
  }
}
