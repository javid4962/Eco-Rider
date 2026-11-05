import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InteractiveVoiceService } from './interactive-voice.service';
import {
  IvrVoiceSessionDto,
  ProcessVoiceCommandDto,
} from '@ecoride/contracts';

@Controller('interactive-voice')
export class InteractiveVoiceController {
  constructor(private readonly voiceService: InteractiveVoiceService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  processVoiceCommand(@Body() dto: ProcessVoiceCommandDto): Promise<IvrVoiceSessionDto> {
    return this.voiceService.processVoiceCommand(dto);
  }
}

