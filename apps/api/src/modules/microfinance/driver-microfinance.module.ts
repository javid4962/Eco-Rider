import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaptainEmiPlan } from '../../database/entities/captain-emi-plan.entity';
import { EmiDeductionRecord } from '../../database/entities/emi-deduction-record.entity';
import { DriverMicrofinanceService } from './driver-microfinance.service';
import { DriverMicrofinanceController } from './driver-microfinance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CaptainEmiPlan, EmiDeductionRecord])],
  controllers: [DriverMicrofinanceController],
  providers: [DriverMicrofinanceService],
  exports: [DriverMicrofinanceService],
})
export class DriverMicrofinanceModule {}

