import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { FloodEvacuationRoutingService } from './flood-evacuation-routing.service';
import { IngestFloodSensorDto } from '@ecoride/contracts';

@Controller('flood-evacuation-routing')
export class FloodEvacuationRoutingController {
  constructor(private readonly service: FloodEvacuationRoutingService) {}

  @Post('sensors')
  async ingest(@Body() dto: IngestFloodSensorDto) {
    return this.service.ingestFloodSensor(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getAlert(id);
  }
}

