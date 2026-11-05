import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZeroEmissionZonesService } from './zero-emission-zones.service';
import { ZeroEmissionZonesController } from './zero-emission-zones.controller';
import { ZeroEmissionZone } from '../../database/entities/zero-emission-zone.entity';
import { ZezComplianceRecord } from '../../database/entities/zez-compliance-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ZeroEmissionZone, ZezComplianceRecord])],
  controllers: [ZeroEmissionZonesController],
  providers: [ZeroEmissionZonesService],
  exports: [ZeroEmissionZonesService],
})
export class ZeroEmissionZonesModule {}
