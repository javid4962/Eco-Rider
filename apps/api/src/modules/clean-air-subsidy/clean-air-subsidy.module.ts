import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AqiMonitoringRecord } from '../../database/entities/aqi-monitoring-record.entity';
import { CleanAirSubsidyService } from './clean-air-subsidy.service';
import { CleanAirSubsidyController } from './clean-air-subsidy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AqiMonitoringRecord])],
  controllers: [CleanAirSubsidyController],
  providers: [CleanAirSubsidyService],
  exports: [CleanAirSubsidyService],
})
export class CleanAirSubsidyModule {}
