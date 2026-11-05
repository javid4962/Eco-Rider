import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MunicipalGeofencesService } from './municipal-geofences.service';
import {
  MunicipalMicroGeofenceDto,
  StagingBayAllocationDto,
  CheckStagingAvailabilityDto,
} from '@ecoride/contracts';

@Controller('municipal-geofences')
export class MunicipalGeofencesController {
  constructor(private readonly geofenceService: MunicipalGeofencesService) {}

  @Get('zones')
  @HttpCode(HttpStatus.OK)
  getActiveZones(): Promise<MunicipalMicroGeofenceDto[]> {
    return this.geofenceService.getActiveZones();
  }

  @Post('bays/allocate')
  @HttpCode(HttpStatus.OK)
  allocateStagingBay(@Body() dto: CheckStagingAvailabilityDto): Promise<StagingBayAllocationDto> {
    return this.geofenceService.allocateStagingBay(dto);
  }
}

