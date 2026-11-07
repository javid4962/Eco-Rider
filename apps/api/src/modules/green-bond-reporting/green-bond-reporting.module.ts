import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GreenBondAuditReportEntity } from '../../database/entities/green-bond-audit-report.entity';
import { GreenBondReportingService } from './green-bond-reporting.service';
import { GreenBondReportingController } from './green-bond-reporting.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GreenBondAuditReportEntity])],
  controllers: [GreenBondReportingController],
  providers: [GreenBondReportingService],
  exports: [GreenBondReportingService],
})
export class GreenBondReportingModule {}
