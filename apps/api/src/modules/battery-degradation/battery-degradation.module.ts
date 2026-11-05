import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryDegradationRecord } from '../../database/entities/battery-degradation-record.entity';
import { BessRepurposingOrder } from '../../database/entities/bess-repurposing-order.entity';
import { BatteryDegradationService } from './battery-degradation.service';
import { BatteryDegradationController } from './battery-degradation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BatteryDegradationRecord, BessRepurposingOrder])],
  controllers: [BatteryDegradationController],
  providers: [BatteryDegradationService],
  exports: [BatteryDegradationService],
})
export class BatteryDegradationModule {}

