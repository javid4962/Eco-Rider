import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpeedLimitZone } from '../../database/entities/speed-limit-zone.entity';
import { SpeedViolationIncident } from '../../database/entities/speed-violation-incident.entity';
import { SpeedGovernorService } from './speed-governor.service';
import { SpeedGovernorController } from './speed-governor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SpeedLimitZone, SpeedViolationIncident])],
  controllers: [SpeedGovernorController],
  providers: [SpeedGovernorService],
  exports: [SpeedGovernorService],
})
export class SpeedGovernorModule {}

