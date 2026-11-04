import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SafetyService } from './safety.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  TriggerSosDto,
  SosAlertResponseDto,
  LiveTrackingDto,
  ResolveIncidentDto,
  SafetyIncidentSummaryDto,
  IncidentStatus,
} from '@ecoride/contracts';

@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('sos')
  @HttpCode(HttpStatus.CREATED)
  triggerSos(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: TriggerSosDto,
  ): Promise<SosAlertResponseDto> {
    return this.safetyService.triggerSos(actor, dto);
  }

  @Get('tracking/:token')
  getLiveTracking(@Param('token') token: string): Promise<LiveTrackingDto> {
    return this.safetyService.getLiveTrackingByToken(token);
  }

  @Get('incidents')
  listIncidents(
    @Query('status') status?: IncidentStatus,
  ): Promise<SafetyIncidentSummaryDto[]> {
    return this.safetyService.listIncidents(status);
  }

  @Post('incidents/:id/resolve')
  @HttpCode(HttpStatus.OK)
  resolveIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: ResolveIncidentDto,
  ): Promise<SafetyIncidentSummaryDto> {
    return this.safetyService.resolveIncident(id, actor, dto);
  }
}

