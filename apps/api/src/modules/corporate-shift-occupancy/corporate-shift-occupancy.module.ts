import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateShiftReconciliationEntity } from '../../database/entities/corporate-shift-reconciliation.entity';
import { CorporateShiftOccupancyService } from './corporate-shift-occupancy.service';
import { CorporateShiftOccupancyController } from './corporate-shift-occupancy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorporateShiftReconciliationEntity])],
  controllers: [CorporateShiftOccupancyController],
  providers: [CorporateShiftOccupancyService],
  exports: [CorporateShiftOccupancyService],
})
export class CorporateShiftOccupancyModule {}

