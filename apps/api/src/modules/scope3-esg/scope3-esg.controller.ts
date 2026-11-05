import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Scope3EsgService } from './scope3-esg.service';
import { Scope3AuditReportDto, GenerateScope3ReportDto } from '@ecoride/contracts';

@Controller('scope3-esg')
export class Scope3EsgController {
  constructor(private readonly esgService: Scope3EsgService) {}

  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  generateReport(@Body() dto: GenerateScope3ReportDto): Promise<Scope3AuditReportDto> {
    return this.esgService.generateReport(dto);
  }
}

