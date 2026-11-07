import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatterySecondLifeAssessment } from '../../database/entities/battery-second-life-assessment.entity';
import { BatterySecondLifeService } from './battery-second-life.service';
import { BatterySecondLifeController } from './battery-second-life.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BatterySecondLifeAssessment])],
  controllers: [BatterySecondLifeController],
  providers: [BatterySecondLifeService],
  exports: [BatterySecondLifeService],
})
export class BatterySecondLifeModule {}

