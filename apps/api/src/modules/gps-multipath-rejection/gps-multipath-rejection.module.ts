import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GpsMultipathFilterLogEntity } from '../../database/entities/gps-multipath-filter-log.entity';
import { GpsMultipathRejectionService } from './gps-multipath-rejection.service';
import { GpsMultipathRejectionController } from './gps-multipath-rejection.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GpsMultipathFilterLogEntity])],
  controllers: [GpsMultipathRejectionController],
  providers: [GpsMultipathRejectionService],
  exports: [GpsMultipathRejectionService],
})
export class GpsMultipathRejectionModule {}

