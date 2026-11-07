import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { VernacularVoiceDetourService } from './vernacular-voice-detour.service';
import { LowBatteryDetourAlert, TeluguVoicePromptResult } from '@ecoride/contracts';

@Controller('v1/voice-navigation')
export class VernacularVoiceDetourController {
  constructor(private readonly voiceService: VernacularVoiceDetourService) {}

  @Post('detour-prompt')
  async generateDetourPrompt(@Body() body: LowBatteryDetourAlert): Promise<TeluguVoicePromptResult> {
    return this.voiceService.generateDetourPrompt(body);
  }

  @Get('prompts/captain/:captainId')
  async getCaptainPrompts(@Param('captainId') captainId: string) {
    return this.voiceService.getCaptainPrompts(captainId);
  }
}
