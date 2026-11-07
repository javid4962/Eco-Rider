import { Body, Controller, Post } from '@nestjs/common';
import { V2hResidentialBackupService } from './v2h-residential-backup.service';
import { InitiateV2hDischargeDto, V2hDischargeTelemetryDto } from '@ecoride/contracts';

@Controller('v2h-residential-backup')
export class V2hResidentialBackupController {
  constructor(private readonly service: V2hResidentialBackupService) {}

  @Post('initiate')
  async initiate(@Body() dto: InitiateV2hDischargeDto) {
    return this.service.initiateV2hSession(dto);
  }

  @Post('telemetry')
  async telemetry(@Body() dto: V2hDischargeTelemetryDto) {
    return this.service.updateTelemetry(dto);
  }
}

