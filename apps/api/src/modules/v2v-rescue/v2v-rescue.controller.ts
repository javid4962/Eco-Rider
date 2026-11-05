import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { V2vRescueService } from './v2v-rescue.service';
import {
  RequestV2vRescueDto,
  V2vRescueMissionResult,
} from '@ecoride/contracts';
import { V2vRescueMission } from '../../database/entities/v2v-rescue-mission.entity';

@Controller('v2v-rescue')
export class V2vRescueController {
  constructor(private readonly rescueService: V2vRescueService) {}

  @Post('dispatch')
  async dispatchRescue(@Body() dto: RequestV2vRescueDto): Promise<V2vRescueMissionResult> {
    return await this.rescueService.dispatchRescue(dto);
  }

  @Patch('missions/:id/complete')
  async completeRescue(
    @Param('id') id: string,
    @Body('transferredKwh') transferredKwh: number,
  ): Promise<V2vRescueMissionResult> {
    return await this.rescueService.completeRescue(id, transferredKwh);
  }

  @Get('missions/:id')
  async getMission(@Param('id') id: string): Promise<V2vRescueMission> {
    return await this.rescueService.getMission(id);
  }
}
