import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { HighwayTollService } from './highway-toll.service';
import { NhaiTollPlazaDto, TollCrossingRecordDto, IngestTollCrossingDto } from '@ecoride/contracts';

@Controller('highway-toll')
export class HighwayTollController {
  constructor(private readonly tollService: HighwayTollService) {}

  @Get('plazas')
  @HttpCode(HttpStatus.OK)
  getTollPlazas(): Promise<NhaiTollPlazaDto[]> {
    return this.tollService.getTollPlazas();
  }

  @Post('crossings')
  @HttpCode(HttpStatus.OK)
  ingestTollCrossing(@Body() dto: IngestTollCrossingDto): Promise<TollCrossingRecordDto> {
    return this.tollService.ingestTollCrossing(dto);
  }
}

