import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OccPushToTalkChannelEntity } from '../../database/entities/occ-push-to-talk-channel.entity';
import { OccPushToTalkService } from './occ-push-to-talk.service';
import { OccPushToTalkController } from './occ-push-to-talk.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OccPushToTalkChannelEntity])],
  controllers: [OccPushToTalkController],
  providers: [OccPushToTalkService],
  exports: [OccPushToTalkService],
})
export class OccPushToTalkModule {}
