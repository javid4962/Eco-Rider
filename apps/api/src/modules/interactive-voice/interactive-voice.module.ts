import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteractiveVoiceService } from './interactive-voice.service';
import { InteractiveVoiceController } from './interactive-voice.controller';
import { IvrVoiceSession } from '../../database/entities/ivr-voice-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IvrVoiceSession])],
  controllers: [InteractiveVoiceController],
  providers: [InteractiveVoiceService],
  exports: [InteractiveVoiceService],
})
export class InteractiveVoiceModule {}

