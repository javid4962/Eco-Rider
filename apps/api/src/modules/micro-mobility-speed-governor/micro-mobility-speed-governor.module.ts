import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroMobilityPedestrianZone } from '../../database/entities/micro-mobility-pedestrian-zone.entity';
import { MicroMobilitySpeedGovernorService } from './micro-mobility-speed-governor.service';
import { MicroMobilitySpeedGovernorController } from './micro-mobility-speed-governor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MicroMobilityPedestrianZone])],
  controllers: [MicroMobilitySpeedGovernorController],
  providers: [MicroMobilitySpeedGovernorService],
  exports: [MicroMobilitySpeedGovernorService],
})
export class MicroMobilitySpeedGovernorModule {}

