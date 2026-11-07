import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateCostCenter } from '../../database/entities/corporate-cost-center.entity';
import { CorporateCostCenterService } from './corporate-cost-center.service';
import { CorporateCostCenterController } from './corporate-cost-center.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CorporateCostCenter])],
  controllers: [CorporateCostCenterController],
  providers: [CorporateCostCenterService],
  exports: [CorporateCostCenterService],
})
export class CorporateCostCenterModule {}
