import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MicroMobilityService } from './micro-mobility.service';
import {
  StartMicroMobilitySessionDto,
  EndMicroMobilitySessionDto,
  MicroMobilityBillingResult,
} from '@ecoride/contracts';
import { MicroMobilitySession } from '../../database/entities/micro-mobility-session.entity';

@Controller('micro-mobility')
export class MicroMobilityController {
  constructor(private readonly mobilityService: MicroMobilityService) {}

  @Post('sessions/unlock')
  async startSession(
    @Body() dto: StartMicroMobilitySessionDto,
  ): Promise<MicroMobilitySession> {
    return await this.mobilityService.startSession(dto);
  }

  @Post('sessions/dock-end')
  async endSession(
    @Body() dto: EndMicroMobilitySessionDto,
  ): Promise<MicroMobilityBillingResult> {
    return await this.mobilityService.endSession(dto);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string): Promise<MicroMobilitySession> {
    return await this.mobilityService.getSession(id);
  }
}
