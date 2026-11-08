import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { Scope3CarbonOffsetService } from './scope3-carbon-offset.service';
import { GenerateScope3CertificateDto } from '@ecoride/contracts';

@Controller('scope3-carbon-offset')
export class Scope3CarbonOffsetController {
  constructor(private readonly service: Scope3CarbonOffsetService) {}

  @Post('certificate')
  async generate(@Body() dto: GenerateScope3CertificateDto) {
    return this.service.generateCertificate(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getCertificate(id);
  }
}
