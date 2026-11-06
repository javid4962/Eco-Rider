import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { CaptainMentorshipService } from './captain-mentorship.service';
import {
  CreateMentorshipPairingDto,
  UpdateMentorshipProgressDto,
  MentorshipGraduationResult,
} from '@ecoride/contracts';
import { CaptainMentorshipPairing } from '../../database/entities/captain-mentorship-pairing.entity';

@Controller('captain-mentorship')
export class CaptainMentorshipController {
  constructor(private readonly mentorshipService: CaptainMentorshipService) {}

  @Post('pairings')
  async createPairing(@Body() dto: CreateMentorshipPairingDto): Promise<CaptainMentorshipPairing> {
    return await this.mentorshipService.createPairing(dto);
  }

  @Patch('pairings/:id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body() dto: UpdateMentorshipProgressDto,
  ): Promise<CaptainMentorshipPairing> {
    return await this.mentorshipService.updateProgress(id, dto);
  }

  @Post('pairings/:id/evaluate')
  async evaluateGraduation(@Param('id') id: string): Promise<MentorshipGraduationResult> {
    return await this.mentorshipService.evaluateGraduation(id);
  }

  @Get('mentors/:mentorId/pairings')
  async getPairingsForMentor(
    @Param('mentorId') mentorId: string,
  ): Promise<CaptainMentorshipPairing[]> {
    return await this.mentorshipService.getPairingsForMentor(mentorId);
  }
}

