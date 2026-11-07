import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolarMpptCouplingSessionEntity } from '../../database/entities/solar-mppt-coupling-session.entity';
import { SolarMpptCouplingService } from './solar-mppt-coupling.service';
import { SolarMpptCouplingController } from './solar-mppt-coupling.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SolarMpptCouplingSessionEntity])],
  controllers: [SolarMpptCouplingController],
  providers: [SolarMpptCouplingService],
  exports: [SolarMpptCouplingService],
})
export class SolarMpptCouplingModule {}

