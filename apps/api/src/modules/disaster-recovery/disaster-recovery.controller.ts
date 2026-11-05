import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DisasterRecoveryService } from './disaster-recovery.service';
import {
  ReplicaSyncStatusDto,
  FailoverDrillResultDto,
} from '@ecoride/contracts';

@Controller('disaster-recovery')
export class DisasterRecoveryController {
  constructor(private readonly drService: DisasterRecoveryService) {}

  @Get('health')
  getReplicationHealth(): Promise<ReplicaSyncStatusDto> {
    return this.drService.getReplicationHealth();
  }

  @Post('heartbeat')
  @HttpCode(HttpStatus.OK)
  recordHeartbeat(@Body() body: Partial<ReplicaSyncStatusDto>): Promise<ReplicaSyncStatusDto> {
    return this.drService.recordHeartbeat(body);
  }

  @Post('drill')
  @HttpCode(HttpStatus.OK)
  simulateFailoverDrill(@Body() body: { standbyNodeId: string }): Promise<FailoverDrillResultDto> {
    return this.drService.simulateFailoverDrill(body.standbyNodeId);
  }
}

