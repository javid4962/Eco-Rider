import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { VernacularService } from './vernacular.service';
import { VoicePromptEvent, VoicePromptDto, CaptainVoiceSettingsDto } from '@ecoride/contracts';

@Controller('vernacular')
export class VernacularController {
  constructor(private readonly vernacularService: VernacularService) {}

  @Get('prompts')
  @HttpCode(HttpStatus.OK)
  getVoicePrompt(
    @Query('event') event: VoicePromptEvent,
    @Query('lang') lang?: string,
    @Query('amount') amount?: string,
  ): Promise<VoicePromptDto> {
    return this.vernacularService.getVoicePrompt(event, lang, amount ? { amount } : undefined);
  }

  @Get('captains/:captainId/settings')
  @HttpCode(HttpStatus.OK)
  getCaptainSettings(
    @Param('captainId', ParseUUIDPipe) captainId: string,
  ): Promise<CaptainVoiceSettingsDto> {
    return this.vernacularService.getCaptainSettings(captainId);
  }

  @Post('captains/:captainId/settings')
  @HttpCode(HttpStatus.OK)
  updateCaptainSettings(
    @Param('captainId', ParseUUIDPipe) captainId: string,
    @Body() body: Partial<CaptainVoiceSettingsDto>,
  ): Promise<CaptainVoiceSettingsDto> {
    return this.vernacularService.updateCaptainSettings(captainId, body);
  }
}

