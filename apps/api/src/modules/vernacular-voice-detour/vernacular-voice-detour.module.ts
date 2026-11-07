import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VernacularNavigationPromptEntity } from '../../database/entities/vernacular-navigation-prompt.entity';
import { VernacularVoiceDetourService } from './vernacular-voice-detour.service';
import { VernacularVoiceDetourController } from './vernacular-voice-detour.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VernacularNavigationPromptEntity])],
  controllers: [VernacularVoiceDetourController],
  providers: [VernacularVoiceDetourService],
  exports: [VernacularVoiceDetourService],
})
export class VernacularVoiceDetourModule {}

