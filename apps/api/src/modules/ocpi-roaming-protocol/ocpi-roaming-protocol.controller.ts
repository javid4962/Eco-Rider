import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { OcpiRoamingProtocolService } from './ocpi-roaming-protocol.service';
import { OcpiSessionStartRequest, OcpiRoamingSessionRecord } from '@ecoride/contracts';

@Controller('v1/ocpi')
export class OcpiRoamingProtocolController {
  constructor(private readonly ocpiService: OcpiRoamingProtocolService) {}

  @Post('sessions/start')
  async startRoamingSession(@Body() body: OcpiSessionStartRequest): Promise<OcpiRoamingSessionRecord> {
    return this.ocpiService.startRoamingSession(body);
  }

  @Post('sessions/:sessionId/stop')
  async stopRoamingSession(
    @Param('sessionId') sessionId: string,
    @Body() body: { totalKwh: number },
  ): Promise<OcpiRoamingSessionRecord> {
    return this.ocpiService.stopRoamingSession(sessionId, body.totalKwh);
  }

  @Get('sessions/:sessionId')
  async getSession(@Param('sessionId') sessionId: string): Promise<OcpiRoamingSessionRecord> {
    return this.ocpiService.getSession(sessionId);
  }
}
