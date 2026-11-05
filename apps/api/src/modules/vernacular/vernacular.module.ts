import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainVoicePreference } from '../../database/entities/captain-voice-preference.entity';
import { VernacularService } from './vernacular.service';
import { VernacularController } from './vernacular.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainVoicePreference])],
  controllers: [VernacularController],
  providers: [VernacularService],
  exports: [VernacularService],
})
export class VernacularModule {}

