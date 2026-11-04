import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InvoicesService } from './invoices.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CreatePaymentOrderDto,
  PaymentOrderResponse,
  WebhookIngestResponse,
  RecordCashPaymentDto,
  RecordCashPaymentResponse,
  ProcessRefundDto,
  ProcessRefundResponse,
  TaxInvoiceDto,
} from '@ecoride/contracts';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  /**
   * EV-049: Create Payment Order for Ride.
   */
  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  async createOrder(
    @Body() dto: CreatePaymentOrderDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<PaymentOrderResponse> {
    return this.paymentsService.createRidePaymentOrder(dto.bookingId, actor, dto);
  }

  /**
   * EV-050: Ingest Razorpay Webhook.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: unknown,
    @Headers('x-razorpay-signature') signature?: string,
    @Headers('x-razorpay-webhook-secret') secretHeader?: string,
  ): Promise<WebhookIngestResponse> {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    return this.paymentsService.handleRazorpayWebhook(rawBody, signature || '', secretHeader);
  }

  /**
   * EV-052: Get Statutory AP GST Tax Invoice.
   */
  @Get('invoices/:bookingId')
  async getInvoice(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<TaxInvoiceDto> {
    return this.invoicesService.getOrCreateInvoice(bookingId);
  }

  /**
   * EV-053: Captain Cash Collection.
   */
  @Post('cash/collect')
  @HttpCode(HttpStatus.OK)
  async recordCash(
    @Body() dto: RecordCashPaymentDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<RecordCashPaymentResponse> {
    return this.paymentsService.recordCashPayment(actor, dto);
  }

  /**
   * EV-054: Process Ride Refund / Cancellation Compensation.
   */
  @Post('refunds')
  @HttpCode(HttpStatus.OK)
  async processRefund(
    @Body() dto: ProcessRefundDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<ProcessRefundResponse> {
    return this.paymentsService.processRideRefund(actor, dto);
  }

  /**
   * Get payment history for booking.
   */
  @Get('bookings/:bookingId')
  async getBookingPayments(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    return this.paymentsService.getPaymentRecordsForBooking(bookingId);
  }
}
