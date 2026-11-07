import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PantographChargingService } from './pantograph-charging.service';
import {
  PantographChargingSessionRequest,
  PantographChargingSessionRecord,
} from '@ecoride/contracts';

@Controller('v1/pantograph')
export class PantographChargingController {
  constructor(private readonly pantographService: PantographChargingService) {}

  @Post('start-session')
  async startSession(@Body() body: PantographChargingSessionRequest): Promise<PantographChargingSessionRecord> {
    return this.pantographService.startSession(body);
  }

  @Post('stop-session/:sessionId')
  async stopSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { finalSocPct: number },
  ): Promise<PantographChargingSessionRecord> {
    return this.pantographService.stopSession(sessionId, body.finalSocPct);
  }

  @Get('sessions/bus/:busId')
  async getBusSessions(@Param('busId') busId: string) {
    return this.pantographService.getBusSessions(busId);
  }
}
