import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverFatigueEvent } from '../../database/entities/driver-fatigue-event.entity';
import { DmsFatigueService } from './dms-fatigue.service';
import { DmsFatigueController } from './dms-fatigue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DriverFatigueEvent])],
  controllers: [DmsFatigueController],
  providers: [DmsFatigueService],
  exports: [DmsFatigueService],
})
export class DmsFatigueModule {}
