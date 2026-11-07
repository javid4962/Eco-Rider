import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OccCommandWallService } from './occ-command-wall.service';
import { OccEscalationIncidentDto } from '@ecoride/contracts';

@Controller('occ-command-wall')
export class OccCommandWallController {
  constructor(private readonly service: OccCommandWallService) {}

  @Get('health')
  async getHealth() {
    return this.service.getOccHealthSummary();
  }

  @Post('switch-posture')
  async switchPosture(
    @Body() dto: OccEscalationIncidentDto,
    @Query('authorizedBy') authorizedBy: string,
  ) {
    return this.service.switchOperationalPosture(dto, authorizedBy || 'SUPER_ADMIN_OCC_CHIEF');
  }
}

