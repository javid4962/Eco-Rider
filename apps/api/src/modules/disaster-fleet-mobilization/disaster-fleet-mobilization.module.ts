import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DisasterMobilizationLog } from '../../database/entities/disaster-mobilization-log.entity';
import { DisasterFleetMobilizationService } from './disaster-fleet-mobilization.service';
import { DisasterFleetMobilizationController } from './disaster-fleet-mobilization.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DisasterMobilizationLog])],
  controllers: [DisasterFleetMobilizationController],
  providers: [DisasterFleetMobilizationService],
  exports: [DisasterFleetMobilizationService],
})
export class DisasterFleetMobilizationModule {}
