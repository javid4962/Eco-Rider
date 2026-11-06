import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EwayBillRecord } from '../../database/entities/eway-bill-record.entity';
import { EwayBillService } from './eway-bill.service';
import { EwayBillController } from './eway-bill.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EwayBillRecord])],
  controllers: [EwayBillController],
  providers: [EwayBillService],
  exports: [EwayBillService],
})
export class EwayBillModule {}
