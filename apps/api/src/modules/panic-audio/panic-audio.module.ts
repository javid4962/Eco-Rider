import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PanicAudioIncident } from '../../database/entities/panic-audio-incident.entity';
import { PanicAudioService } from './panic-audio.service';
import { PanicAudioController } from './panic-audio.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PanicAudioIncident])],
  controllers: [PanicAudioController],
  providers: [PanicAudioService],
  exports: [PanicAudioService],
})
export class PanicAudioModule {}

