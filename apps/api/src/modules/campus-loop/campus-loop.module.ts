import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampusShuttleSchedule } from '../../database/entities/campus-shuttle-schedule.entity';
import { CampusLoopService } from './campus-loop.service';
import { CampusLoopController } from './campus-loop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CampusShuttleSchedule])],
  controllers: [CampusLoopController],
  providers: [CampusLoopService],
  exports: [CampusLoopService],
})
export class CampusLoopModule {}
