import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainMentorshipPairing } from '../../database/entities/captain-mentorship-pairing.entity';
import { CaptainMentorshipService } from './captain-mentorship.service';
import { CaptainMentorshipController } from './captain-mentorship.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainMentorshipPairing])],
  controllers: [CaptainMentorshipController],
  providers: [CaptainMentorshipService],
  exports: [CaptainMentorshipService],
})
export class CaptainMentorshipModule {}

