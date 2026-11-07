import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutiveKpiSnapshot } from '../../database/entities/executive-kpi-snapshot.entity';
import { ExecutiveKpiReportingService } from './executive-kpi-reporting.service';
import { ExecutiveKpiReportingController } from './executive-kpi-reporting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExecutiveKpiSnapshot])],
  controllers: [ExecutiveKpiReportingController],
  providers: [ExecutiveKpiReportingService],
  exports: [ExecutiveKpiReportingService],
})
export class ExecutiveKpiReportingModule {}

