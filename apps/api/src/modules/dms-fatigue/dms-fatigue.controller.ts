import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DmsFatigueService } from './dms-fatigue.service';
import {
  DmsCameraTelemetryDto,
  DmsFatigueAssessmentResult,
} from '@ecoride/contracts';
import { DriverFatigueEvent } from '../../database/entities/driver-fatigue-event.entity';

@Controller('dms-fatigue')
export class DmsFatigueController {
  constructor(private readonly fatigueService: DmsFatigueService) {}

  @Post('telemetry')
  async assessFatigue(@Body() dto: DmsCameraTelemetryDto): Promise<DmsFatigueAssessmentResult> {
    return await this.fatigueService.assessFatigue(dto);
  }

  @Get('captains/:captainId/events')
  async getEventsForCaptain(@Param('captainId') captainId: string): Promise<DriverFatigueEvent[]> {
    return await this.fatigueService.getRecentEventsForCaptain(captainId);
  }
}

