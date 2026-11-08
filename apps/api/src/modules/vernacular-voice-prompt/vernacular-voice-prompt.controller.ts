import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { VernacularVoicePromptService } from './vernacular-voice-prompt.service';
import { GenerateVoicePromptDto } from '@ecoride/contracts';

@Controller('vernacular-voice-prompt')
export class VernacularVoicePromptController {
  constructor(private readonly service: VernacularVoicePromptService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateVoicePromptDto) {
    return this.service.generatePrompt(dto);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.getPrompt(id);
  }
}
