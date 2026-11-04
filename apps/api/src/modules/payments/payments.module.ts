import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRecord } from '../../database/entities/payment-record.entity';
import { TaxInvoice } from '../../database/entities/tax-invoice.entity';
import { Booking } from '../../database/entities/booking.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { ProvidersModule } from '../providers/providers.module';
import { PaymentsService } from './payments.service';
import { InvoicesService } from './invoices.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentRecord, TaxInvoice, Booking, LedgerEntry]),
    ProvidersModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, InvoicesService],
  exports: [PaymentsService, InvoicesService],
})
export class PaymentsModule {}

