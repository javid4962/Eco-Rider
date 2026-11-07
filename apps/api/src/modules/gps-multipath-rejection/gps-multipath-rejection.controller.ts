import { Controller, Post, Get, Body } from '@nestjs/common';
import { GpsMultipathRejectionService } from './gps-multipath-rejection.service';
import { RawGnssFix, FusedLocationTelemetry, CanyonZone } from '@ecoride/contracts';

@Controller('v1/location')
export class GpsMultipathRejectionController {
  constructor(private readonly multipathService: GpsMultipathRejectionService) {}

  @Post('filter-gnss')
  async filterGnssFix(@Body() body: RawGnssFix): Promise<FusedLocationTelemetry> {
    return this.multipathService.filterGnssFix(body);
  }

  @Get('canyon-zones')
  getCanyonZones(): CanyonZone[] {
    return this.multipathService.getCanyonZones();
  }
}
