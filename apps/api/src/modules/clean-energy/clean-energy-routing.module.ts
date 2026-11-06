import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleanEnergyRoutingService } from './clean-energy-routing.service';
import { CleanEnergyRoutingController } from './clean-energy-routing.controller';
import { DepotSolarGeneration } from '../../database/entities/depot-solar-generation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DepotSolarGeneration])],
  controllers: [CleanEnergyRoutingController],
  providers: [CleanEnergyRoutingService],
  exports: [CleanEnergyRoutingService],
})
export class CleanEnergyRoutingModule {}

