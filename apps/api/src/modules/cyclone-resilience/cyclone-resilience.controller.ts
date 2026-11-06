import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { CycloneResilienceService } from './cyclone-resilience.service';
import {
  CycloneAlertFeedDto,
  TriggerFleetRelocationDto,
  FleetRelocationPlanResult,
} from '@ecoride/contracts';
import { CycloneRelocationPlan } from '../../database/entities/cyclone-relocation-plan.entity';

@Controller('cyclone-resilience')
export class CycloneResilienceController {
  constructor(private readonly resilienceService: CycloneResilienceService) {}

  @Post('relocate')
  async createRelocationPlan(
    @Body('alert') alertDto: CycloneAlertFeedDto,
    @Body('relocate') relocateDto: TriggerFleetRelocationDto,
  ): Promise<FleetRelocationPlanResult> {
    return await this.resilienceService.createRelocationPlan(alertDto, relocateDto);
  }

  @Patch('plans/:id/progress')
  async updateStagingProgress(
    @Param('id') id: string,
    @Body('stagedIncrement') increment: number,
  ): Promise<FleetRelocationPlanResult> {
    return await this.resilienceService.updateStagingProgress(id, increment);
  }

  @Get('plans/:id')
  async getPlan(@Param('id') id: string): Promise<CycloneRelocationPlan> {
    return await this.resilienceService.getPlan(id);
  }
}

