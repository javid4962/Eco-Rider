import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { V2vRescueMission } from '../../database/entities/v2v-rescue-mission.entity';
import { V2vRescueService } from './v2v-rescue.service';
import { V2vRescueController } from './v2v-rescue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([V2vRescueMission])],
  controllers: [V2vRescueController],
  providers: [V2vRescueService],
  exports: [V2vRescueService],
})
export class V2vRescueModule {}

