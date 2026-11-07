import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CellSwellingDiagnosticService } from './cell-swelling-diagnostic.service';
import { PerformCellDiagnosticDto } from '@ecoride/contracts';

@Controller('cell-swelling-diagnostic')
export class CellSwellingDiagnosticController {
  constructor(private readonly service: CellSwellingDiagnosticService) {}

  @Post('diagnostics')
  async performDiagnostic(@Body() dto: PerformCellDiagnosticDto) {
    return this.service.performDiagnostic(dto);
  }

  @Get('diagnostics/:id')
  async getById(@Param('id') id: string) {
    return this.service.getDiagnosticLog(id);
  }
}

