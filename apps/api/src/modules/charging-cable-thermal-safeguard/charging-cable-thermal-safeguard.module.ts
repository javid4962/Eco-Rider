import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargingCableThermalLogEntity } from '../../database/entities/charging-cable-thermal-log.entity';
import { ChargingCableThermalSafeguardService } from './charging-cable-thermal-safeguard.service';
import { ChargingCableThermalSafeguardController } from './charging-cable-thermal-safeguard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChargingCableThermalLogEntity])],
  controllers: [ChargingCableThermalSafeguardController],
  providers: [ChargingCableThermalSafeguardService],
  exports: [ChargingCableThermalSafeguardService],
})
export class ChargingCableThermalSafeguardModule {}

