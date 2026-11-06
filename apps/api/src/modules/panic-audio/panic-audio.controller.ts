import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PanicAudioService } from './panic-audio.service';
import {
  IngestPanicAudioStreamDto,
  PanicIncidentAssessmentResult,
} from '@ecoride/contracts';
import { PanicAudioIncident } from '../../database/entities/panic-audio-incident.entity';

@Controller('panic-audio')
export class PanicAudioController {
  constructor(private readonly panicService: PanicAudioService) {}

  @Post('stream-ingest')
  async ingestStream(
    @Body() dto: IngestPanicAudioStreamDto,
  ): Promise<PanicIncidentAssessmentResult> {
    return await this.panicService.processPanicStream(dto);
  }

  @Get('incidents/:id')
  async getIncident(@Param('id') id: string): Promise<PanicAudioIncident | null> {
    return await this.panicService.getIncident(id);
  }
}
