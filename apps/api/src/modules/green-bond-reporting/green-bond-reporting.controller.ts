import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { GreenBondReportingService } from './green-bond-reporting.service';
import { GenerateGreenBondReportDto } from '@ecoride/contracts';

@Controller('green-bond-reporting')
export class GreenBondReportingController {
  constructor(private readonly service: GreenBondReportingService) {}

  @Post('reports')
  async generate(@Body() dto: GenerateGreenBondReportDto) {
    return this.service.generateGreenBondReport(dto);
  }

  @Get('reports/:id')
  async getById(@Param('id') id: string) {
    return this.service.getReport(id);
  }
}
