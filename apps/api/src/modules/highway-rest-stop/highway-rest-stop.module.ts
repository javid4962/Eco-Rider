import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighwayRestStopVoucher } from '../../database/entities/highway-rest-stop-voucher.entity';
import { HighwayRestStopService } from './highway-rest-stop.service';
import { HighwayRestStopController } from './highway-rest-stop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HighwayRestStopVoucher])],
  controllers: [HighwayRestStopController],
  providers: [HighwayRestStopService],
  exports: [HighwayRestStopService],
})
export class HighwayRestStopModule {}

