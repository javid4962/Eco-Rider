import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { BmsWarrantyTelemetryService } from './bms-warranty-telemetry.service';
import { BmsWarrantyReading, BmsWarrantyProtectionRecord } from '@ecoride/contracts';

@Controller('v1/bms-warranty')
export class BmsWarrantyTelemetryController {
  constructor(private readonly warrantyService: BmsWarrantyTelemetryService) {}

  @Post('evaluate-thermal')
  async evaluateThermalReading(@Body() body: BmsWarrantyReading): Promise<BmsWarrantyProtectionRecord> {
    return this.warrantyService.evaluateThermalReading(body);
  }

  @Get('vehicle/:vehicleId/history')
  async getVehicleWarrantyLogs(@Param('vehicleId') vehicleId: string) {
    return this.warrantyService.getVehicleWarrantyLogs(vehicleId);
  }
}

