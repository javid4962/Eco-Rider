import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ZeroEmissionZonesService } from './zero-emission-zones.service';
import {
  ZeroEmissionZoneDto,
  ZezComplianceCheckDto,
  ZezCertificateDto,
} from '@ecoride/contracts';

@Controller('zero-emission-zones')
export class ZeroEmissionZonesController {
  constructor(private readonly zezService: ZeroEmissionZonesService) {}

  @Post('zones')
  @HttpCode(HttpStatus.CREATED)
  registerZone(@Body() dto: ZeroEmissionZoneDto): Promise<ZeroEmissionZoneDto> {
    return this.zezService.registerZone(dto);
  }

  @Post('check-compliance')
  @HttpCode(HttpStatus.OK)
  checkCompliance(@Body() dto: ZezComplianceCheckDto): Promise<ZezCertificateDto> {
    return this.zezService.checkCompliance(dto);
  }
}
