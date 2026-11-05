import { Controller, Post, Body, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { EmergencyIslandingService } from './emergency-islanding.service';
import {
  EmergencyPowerMissionDto,
  DispatchEmergencyPowerDto,
} from '@ecoride/contracts';

@Controller('emergency-islanding')
export class EmergencyIslandingController {
  constructor(private readonly islandingService: EmergencyIslandingService) {}

  @Post('missions/dispatch')
  @HttpCode(HttpStatus.CREATED)
  dispatchMission(@Body() dto: DispatchEmergencyPowerDto): Promise<EmergencyPowerMissionDto> {
    return this.islandingService.dispatchPowerMission(dto);
  }

  @Put('missions/:missionId/complete')
  @HttpCode(HttpStatus.OK)
  completeMission(@Param('missionId') missionId: string): Promise<EmergencyPowerMissionDto> {
    return this.islandingService.completeMission(missionId);
  }
}
