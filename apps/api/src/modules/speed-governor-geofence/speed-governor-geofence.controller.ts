import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SpeedGovernorGeofenceService } from './speed-governor-geofence.service';
import { CheckSpeedGovernorGeofenceDto } from '@ecoride/contracts';

@Controller('speed-governor-geofence')
export class SpeedGovernorGeofenceController {
  constructor(private readonly service: SpeedGovernorGeofenceService) {}

  @Post('check')
  async check(@Body() dto: CheckSpeedGovernorGeofenceDto) {
    return this.service.checkGeofence(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getLog(id);
  }
}

