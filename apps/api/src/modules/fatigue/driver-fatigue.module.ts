import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverDutyLog } from '../../database/entities/driver-duty-log.entity';
import { DriverFatigueService } from './driver-fatigue.service';
import { DriverFatigueController } from './driver-fatigue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DriverDutyLog])],
  controllers: [DriverFatigueController],
  providers: [DriverFatigueService],
  exports: [DriverFatigueService],
})
export class DriverFatigueModule {}

