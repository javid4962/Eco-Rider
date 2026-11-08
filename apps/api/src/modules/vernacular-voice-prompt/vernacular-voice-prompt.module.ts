import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VernacularVoicePromptLogEntity } from '../../database/entities/vernacular-voice-prompt-log.entity';
import { VernacularVoicePromptService } from './vernacular-voice-prompt.service';
import { VernacularVoicePromptController } from './vernacular-voice-prompt.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VernacularVoicePromptLogEntity])],
  controllers: [VernacularVoicePromptController],
  providers: [VernacularVoicePromptService],
  exports: [VernacularVoicePromptService],
})
export class VernacularVoicePromptModule {}
