import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AntiRollbackStallTelemetryService } from './anti-rollback-stall-telemetry.service';
import { InclineTelemetryReading, AntiRollbackInterventionResult } from '@ecoride/contracts';

@Controller('v1/incline-telematics')
export class AntiRollbackStallTelemetryController {
  constructor(private readonly rollbackService: AntiRollbackStallTelemetryService) {}

  @Post('evaluate-rollback')
  async evaluateRollback(@Body() body: InclineTelemetryReading): Promise<AntiRollbackInterventionResult> {
    return this.rollbackService.evaluateRollback(body);
  }

  @Get('events/vehicle/:vehicleId')
  async getVehicleEvents(@Param('vehicleId') vehicleId: string) {
    return this.rollbackService.getVehicleEvents(vehicleId);
  }
}
