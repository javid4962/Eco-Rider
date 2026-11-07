import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NcmcTransitTransactionEntity } from '../../database/entities/ncmc-transit-transaction.entity';
import { NcmcTransitPaymentService } from './ncmc-transit-payment.service';
import { NcmcTransitPaymentController } from './ncmc-transit-payment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NcmcTransitTransactionEntity])],
  controllers: [NcmcTransitPaymentController],
  providers: [NcmcTransitPaymentService],
  exports: [NcmcTransitPaymentService],
})
export class NcmcTransitPaymentModule {}

