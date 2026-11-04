import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxInvoice } from '../../database/entities/tax-invoice.entity';
import { Booking } from '../../database/entities/booking.entity';
import { TaxInvoiceDto, ApiErrorCode } from '@ecoride/contracts';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(TaxInvoice)
    private readonly taxInvoiceRepo: Repository<TaxInvoice>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  /**
   * Generates or retrieves an existing statutory AP GST tax invoice for a booking.
   * Rates: Intra-state Andhra Pradesh SAC 996412 (5% GST: 2.5% CGST + 2.5% SGST).
   */
  async getOrCreateInvoice(bookingId: string): Promise<TaxInvoiceDto> {
    const existing = await this.taxInvoiceRepo.findOne({
      where: { bookingId },
    });

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking '${bookingId}' not found for tax invoice generation.`,
      });
    }

    if (existing) {
      return this.toInvoiceDto(existing, booking.bookingCode);
    }

    // Determine total fare in integer paise
    const totalAmountPaise = Math.round((Number(booking.fareAmount) || 50) * 100);

    // Intra-state AP GST (5.0% total: 2.5% CGST + 2.5% SGST)
    const baseFarePaise = Math.round(totalAmountPaise / 1.05);
    const totalTaxPaise = totalAmountPaise - baseFarePaise;
    const cgstPaise = Math.floor(totalTaxPaise / 2);
    const sgstPaise = totalTaxPaise - cgstPaise;

    const year = new Date().getFullYear();
    const invoiceNumber = `INV-AP-${year}-${booking.bookingCode.toUpperCase()}`;

    const invoice = this.taxInvoiceRepo.create({
      invoiceNumber,
      bookingId: booking.id,
      riderId: booking.riderId,
      sacCode: '996412',
      supplierGstin: '37AAAAA0000A1Z5',
      supplierState: 'Andhra Pradesh',
      supplierStateCode: '37',
      placeOfSupply: 'Andhra Pradesh (37)',
      baseFarePaise,
      cgstPaise,
      sgstPaise,
      totalTaxPaise,
      totalAmountPaise,
      currency: 'INR',
      invoiceDate: booking.tripCompletedAt || new Date(),
    });

    const saved = await this.taxInvoiceRepo.save(invoice);
    this.logger.log(
      `[InvoicesService] Generated AP GST Tax Invoice ${invoiceNumber} for booking ${booking.id}: ₹${(totalAmountPaise / 100).toFixed(2)} (Base: ₹${(baseFarePaise / 100).toFixed(2)}, CGST 2.5%: ₹${(cgstPaise / 100).toFixed(2)}, SGST 2.5%: ₹${(sgstPaise / 100).toFixed(2)})`,
    );

    return this.toInvoiceDto(saved, booking.bookingCode);
  }

  private toInvoiceDto(invoice: TaxInvoice, bookingCode: string): TaxInvoiceDto {
    return {
      invoiceNumber: invoice.invoiceNumber,
      bookingId: invoice.bookingId,
      bookingCode,
      riderId: invoice.riderId,
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.toISOString() : new Date().toISOString(),
      sacCode: '996412',
      supplierGstin: invoice.supplierGstin,
      supplierState: 'Andhra Pradesh',
      supplierStateCode: '37',
      placeOfSupply: invoice.placeOfSupply,
      baseFarePaise: Number(invoice.baseFarePaise),
      cgstPaise: Number(invoice.cgstPaise),
      sgstPaise: Number(invoice.sgstPaise),
      totalTaxPaise: Number(invoice.totalTaxPaise),
      totalAmountPaise: Number(invoice.totalAmountPaise),
      formattedTotal: `₹${(Number(invoice.totalAmountPaise) / 100).toFixed(2)}`,
      currency: 'INR',
    };
  }
}

