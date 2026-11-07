import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CaptainAcademyService } from './captain-academy.service';
import { CaptainCertificationDto, CaptainAcademyBadgeResult } from '@ecoride/contracts';
import { CaptainTrainingCertification } from '../../database/entities/captain-training-certification.entity';

@Controller('captain-academy')
export class CaptainAcademyController {
  constructor(private readonly academyService: CaptainAcademyService) {}

  @Post('certifications')
  async certifyCaptain(
    @Body() dto: CaptainCertificationDto,
  ): Promise<CaptainAcademyBadgeResult> {
    return await this.academyService.processCertification(dto);
  }

  @Get('captains/:captainId/certifications')
  async getCertifications(
    @Param('captainId') captainId: string,
  ): Promise<CaptainTrainingCertification[]> {
    return await this.academyService.getCertificationsForCaptain(captainId);
  }
}

