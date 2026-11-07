import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PredictiveTireService } from './predictive-tire.service';
import {
  PredictiveTireTelemetryDto,
  PredictiveTireAssessmentResult,
} from '@ecoride/contracts';
import { PredictiveTireAssessment } from '../../database/entities/predictive-tire-assessment.entity';

@Controller('predictive-tire')
export class PredictiveTireController {
  constructor(private readonly tireService: PredictiveTireService) {}

  @Post('assess')
  async assessTireTelemetry(
    @Body() dto: PredictiveTireTelemetryDto,
  ): Promise<PredictiveTireAssessmentResult> {
    return await this.tireService.assessTireTelemetry(dto);
  }

  @Get('vehicles/:vehicleId/assessments')
  async getAssessments(
    @Param('vehicleId') vehicleId: string,
  ): Promise<PredictiveTireAssessment[]> {
    return await this.tireService.getRecentAssessments(vehicleId);
  }
}

