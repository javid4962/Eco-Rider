import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmergencyIslandingService } from './emergency-islanding.service';
import { EmergencyIslandingController } from './emergency-islanding.controller';
import { EmergencyPowerMission } from '../../database/entities/emergency-power-mission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmergencyPowerMission])],
  controllers: [EmergencyIslandingController],
  providers: [EmergencyIslandingService],
  exports: [EmergencyIslandingService],
})
export class EmergencyIslandingModule {}

