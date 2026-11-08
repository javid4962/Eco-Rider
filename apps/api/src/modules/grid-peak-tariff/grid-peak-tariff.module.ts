import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GridPeakTariffLogEntity } from '../../database/entities/grid-peak-tariff-log.entity';
import { GridPeakTariffService } from './grid-peak-tariff.service';
import { GridPeakTariffController } from './grid-peak-tariff.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GridPeakTariffLogEntity])],
  controllers: [GridPeakTariffController],
  providers: [GridPeakTariffService],
  exports: [GridPeakTariffService],
})
export class GridPeakTariffModule {}

