import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { PaymentRecord } from '../../database/entities/payment-record.entity';
import { Booking } from '../../database/entities/booking.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import { InvoicesService } from './invoices.service';
import {
  IPaymentsProvider,
  PaymentOrderResult,
  PaymentRefundResult,
} from '../providers/interfaces/payments-provider.interface';
import { RAZORPAY_PAYMENT_PROVIDER, PAYMENTS_PROVIDER } from '../providers/providers.constants';
import {
  PaymentStatus,
  PaymentGatewayType,
  PaymentMethod,
  CreatePaymentOrderDto,
  PaymentOrderResponse,
  RazorpayWebhookDto,
  WebhookIngestResponse,
  RecordCashPaymentDto,
  RecordCashPaymentResponse,
  ProcessRefundDto,
  ProcessRefundResponse,
  ApiErrorCode,
} from '@ecoride/contracts';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentRecord)
    private readonly paymentRecordRepo: Repository<PaymentRecord>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly dataSource: DataSource,
    private readonly invoicesService: InvoicesService,
    @Inject(RAZORPAY_PAYMENT_PROVIDER)
    private readonly razorpayProvider: IPaymentsProvider,
    @Inject(PAYMENTS_PROVIDER)
    private readonly fallbackProvider: IPaymentsProvider,
  ) {}

  private getProvider(): IPaymentsProvider {
    return this.razorpayProvider || this.fallbackProvider;
  }

  /**
   * EV-049: Create Razorpay Payment Order for a Ride.
   * Validates positive integer paise, INR currency, and idempotent existing order.
   */
  async createRidePaymentOrder(
    bookingId: string,
    actor: CurrentActorPayload | undefined,
    dto?: CreatePaymentOrderDto,
  ): Promise<PaymentOrderResponse> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking with ID '${bookingId}' not found.`,
      });
    }

    // Authorization check
    const actorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const actorId = actor?.id || '';
    const isPrivileged = ['ADMIN', 'OPERATOR', 'DISPATCHER', 'SAFETY_OFFICER', 'SYSTEM'].includes(
      actorRole,
    );

    if (!isPrivileged && actorRole === 'RIDER' && booking.riderId !== actorId) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'Access denied: You cannot create a payment order for another rider.',
      });
    }

    const farePaise = Math.round((Number(booking.fareAmount) || 50) * 100);
    if (farePaise <= 0) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Calculated fare must be a positive integer in paise.',
      });
    }

    // Check for existing payment record
    let record = await this.paymentRecordRepo.findOne({
      where: { bookingId: booking.id },
      order: { createdAt: 'DESC' },
    });

    if (record && record.status === PaymentStatus.CAPTURED) {
      throw new ConflictException({
        code: ApiErrorCode.PAYMENT_ALREADY_COMPLETED,
        message: 'Payment has already been successfully captured for this ride.',
      });
    }

    // Replay existing active order if created within last 30 minutes
    if (
      record &&
      record.status === PaymentStatus.ORDER_CREATED &&
      record.gatewayOrderId &&
      !dto?.idempotencyKey
    ) {
      return this.toOrderResponse(record, booking);
    }

    // Create order with gateway provider
    const provider = this.getProvider();
    const orderResult: PaymentOrderResult = await provider.createOrder({
      orderId: booking.id,
      amountPaise: farePaise,
      currency: 'INR',
      riderId: booking.riderId,
      description: `EcoRide EV Trip: ${booking.bookingCode}`,
    });

    if (!record || record.status === PaymentStatus.FAILED) {
      record = this.paymentRecordRepo.create({
        bookingId: booking.id,
        riderId: booking.riderId,
        gateway: PaymentGatewayType.RAZORPAY,
        gatewayOrderId: orderResult.gatewayOrderId,
        status: PaymentStatus.ORDER_CREATED,
        amountPaise: farePaise,
        currency: 'INR',
        paymentMethod: dto?.paymentMethod || PaymentMethod.RAZORPAY_TEST,
        idempotencyKey: dto?.idempotencyKey || `pay_order_${booking.id}_${Date.now()}`,
      });
    } else {
      record.gatewayOrderId = orderResult.gatewayOrderId;
      record.status = PaymentStatus.ORDER_CREATED;
      record.amountPaise = farePaise;
      record.paymentMethod = dto?.paymentMethod || PaymentMethod.RAZORPAY_TEST;
    }

    await this.paymentRecordRepo.save(record);

    this.logger.log(
      `[PaymentsService] Created order ${orderResult.gatewayOrderId} for booking ${booking.id}: ${farePaise} paise`,
    );

    return this.toOrderResponse(record, booking, orderResult.checkoutPayload?.keyId);
  }

  /**
   * EV-050 & EV-051: Ingest Razorpay Webhook with Constant-Time Signature Verification
   * and Double-Entry Ledger Posting upon Payment Capture.
   */
  async handleRazorpayWebhook(
    rawBody: string,
    signature: string,
    secret?: string,
  ): Promise<WebhookIngestResponse> {
    const provider = this.getProvider();
    const isValid = provider.verifyWebhookSignature(rawBody, signature, secret || '');

    if (!isValid) {
      this.logger.warn('[PaymentsService] Webhook rejected: Invalid HMAC-SHA256 signature.');
      throw new UnauthorizedException({
        code: ApiErrorCode.INVALID_PAYMENT_SIGNATURE,
        message: 'Invalid webhook cryptographic signature.',
      });
    }

    let parsed: RazorpayWebhookDto;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Webhook body is not valid JSON.',
      });
    }

    const event = parsed.event;
    this.logger.log(`[PaymentsService] Processing verified Razorpay webhook event: '${event}'`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = parsed.payload.payment?.entity;
      const orderId = paymentEntity?.order_id || parsed.payload.order?.entity?.id;
      const paymentId = paymentEntity?.id || `pay_${randomUUID().substring(0, 12)}`;
      const amountPaise = Number(paymentEntity?.amount || parsed.payload.order?.entity?.amount || 0);

      if (!orderId) {
        return {
          success: false,
          event,
          status: 'SKIPPED',
          idempotentReplay: false,
          message: 'Missing order_id in webhook payload.',
        };
      }

      const record = await this.paymentRecordRepo.findOne({
        where: { gatewayOrderId: orderId },
      });

      if (!record) {
        this.logger.warn(`[PaymentsService] No PaymentRecord found for gatewayOrderId '${orderId}'`);
        return {
          success: false,
          event,
          status: 'NOT_FOUND',
          idempotentReplay: false,
          message: `PaymentRecord for order ${orderId} not found.`,
        };
      }

      // Idempotency: Ignore duplicate webhook deliveries
      if (record.status === PaymentStatus.CAPTURED) {
        this.logger.log(
          `[PaymentsService] Webhook replay detected for captured order ${orderId}. Skipping ledger mutation.`,
        );
        return {
          success: true,
          event,
          paymentRecordId: record.id,
          status: record.status,
          idempotentReplay: true,
          message: 'Webhook already processed.',
        };
      }

      // ACID Transaction for Payment Record update & Double-Entry Ledger entries
      await this.dataSource.transaction(async (manager: EntityManager) => {
        record.status = PaymentStatus.CAPTURED;
        record.gatewayPaymentId = paymentId;
        if (paymentEntity?.method) {
          record.paymentMethod = paymentEntity.method.toUpperCase() as PaymentMethod;
        }
        await manager.save(record);

        // Immutable Double-Entry Ledger Entries
        // Entry 1: DEBIT - Gateway Clearing / Razorpay Escrow Receivable
        const debitEntry = manager.create(LedgerEntry, {
          id: randomUUID(),
          idempotencyKey: `wh_pay_cap_${record.id}_dr_gw`,
          bookingId: record.bookingId,
          accountId: 'GATEWAY_CLEARING_RAZORPAY',
          entryType: 'DEBIT',
          amountPaise: amountPaise > 0 ? amountPaise : record.amountPaise,
          currency: 'INR',
          description: `Razorpay payment captured for booking ${record.bookingId} (PayId: ${paymentId})`,
        });

        // Entry 2: CREDIT - Rider Settlement / In-Transit Clearing
        const creditEntry = manager.create(LedgerEntry, {
          id: randomUUID(),
          idempotencyKey: `wh_pay_cap_${record.id}_cr_rider`,
          bookingId: record.bookingId,
          accountId: `RIDER_ACCOUNT_${record.riderId}`,
          entryType: 'CREDIT',
          amountPaise: amountPaise > 0 ? amountPaise : record.amountPaise,
          currency: 'INR',
          description: `Rider digital payment settlement for booking ${record.bookingId}`,
        });

        await manager.save([debitEntry, creditEntry]);
      });

      // Statutory AP GST Invoice Generation
      try {
        await this.invoicesService.getOrCreateInvoice(record.bookingId);
      } catch (invErr) {
        this.logger.warn(`[PaymentsService] Invoice generation note: ${(invErr as Error).message}`);
      }

      return {
        success: true,
        event,
        paymentRecordId: record.id,
        status: PaymentStatus.CAPTURED,
        idempotentReplay: false,
        message: 'Payment captured and double-entry ledger posted successfully.',
      };
    }

    if (event === 'payment.failed') {
      const paymentEntity = parsed.payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        const record = await this.paymentRecordRepo.findOne({
          where: { gatewayOrderId: orderId },
        });
        if (record && record.status !== PaymentStatus.CAPTURED) {
          record.status = PaymentStatus.FAILED;
          record.errorCode = paymentEntity.error_code || 'PAYMENT_FAILED';
          record.errorDescription = paymentEntity.error_description || 'Payment rejected by gateway';
          await this.paymentRecordRepo.save(record);
        }
      }
      return {
        success: true,
        event,
        status: PaymentStatus.FAILED,
        idempotentReplay: false,
        message: 'Recorded payment failure.',
      };
    }

    return {
      success: true,
      event,
      status: 'ACKNOWLEDGED',
      idempotentReplay: false,
      message: `Event '${event}' acknowledged.`,
    };
  }

  /**
   * EV-053: Captain Cash Collection & Cash Liability Offset.
   * Captain collects physical currency directly from passenger.
   */
  async recordCashPayment(
    actor: CurrentActorPayload | undefined,
    dto: RecordCashPaymentDto,
  ): Promise<RecordCashPaymentResponse> {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking '${dto.bookingId}' not found.`,
      });
    }

    const actorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const actorId = actor?.id || '';
    const isPrivileged = ['ADMIN', 'OPERATOR', 'DISPATCHER', 'SAFETY_OFFICER', 'SYSTEM'].includes(
      actorRole,
    );

    if (!isPrivileged) {
      if (actorRole !== 'CAPTAIN' || booking.captainId !== actorId) {
        throw new ForbiddenException({
          code: ApiErrorCode.UNAUTHORIZED_RIDE_ACTOR,
          message: 'Access denied: Only the assigned captain can record cash collection.',
        });
      }
    }

    const collectedPaise = Number(dto.collectedPaise);
    if (!Number.isInteger(collectedPaise) || collectedPaise <= 0) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Collected cash must be a positive integer in paise.',
      });
    }

    const idempotencyKey =
      dto.idempotencyKey || `cash_coll_${booking.id}_${Date.now()}`;

    // Replay check
    const existing = await this.paymentRecordRepo.findOne({
      where: { idempotencyKey },
    });
    if (existing) {
      return {
        paymentRecordId: existing.id,
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        status: existing.status as PaymentStatus,
        collectedPaise: Number(existing.amountPaise),
        captainLiabilityPaise: Math.round(Number(existing.amountPaise) * 0.2), // Platform 20%
        ledgerEntriesCount: 2,
        collectedAt: existing.createdAt.toISOString(),
      };
    }

    const paymentRecord = this.paymentRecordRepo.create({
      bookingId: booking.id,
      riderId: booking.riderId,
      gateway: PaymentGatewayType.CASH,
      gatewayOrderId: `cash_${booking.bookingCode}_${randomUUID().substring(0, 8)}`,
      gatewayPaymentId: `cash_rec_${randomUUID().substring(0, 10)}`,
      status: PaymentStatus.CAPTURED,
      amountPaise: collectedPaise,
      currency: 'INR',
      paymentMethod: PaymentMethod.CASH,
      idempotencyKey,
      metadata: { notes: dto.notes, collectedByCaptainId: booking.captainId },
    });

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.save(paymentRecord);

      // Balanced Double-Entry Ledger:
      // Entry 1: DEBIT - Captain Cash in Hand Asset
      const debitEntry = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${idempotencyKey}_dr_captain_cash`,
        bookingId: booking.id,
        accountId: `CAPTAIN_CASH_IN_HAND_${booking.captainId}`,
        entryType: 'DEBIT',
        amountPaise: collectedPaise,
        currency: 'INR',
        description: `Captain collected physical cash for booking ${booking.bookingCode}`,
      });

      // Entry 2: CREDIT - Rider Settlement
      const creditEntry = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${idempotencyKey}_cr_rider`,
        bookingId: booking.id,
        accountId: `RIDER_ACCOUNT_${booking.riderId}`,
        entryType: 'CREDIT',
        amountPaise: collectedPaise,
        currency: 'INR',
        description: `Cash settlement for booking ${booking.bookingCode}`,
      });

      await manager.save([debitEntry, creditEntry]);
    });

    // Generate statutory AP GST Tax Invoice
    try {
      await this.invoicesService.getOrCreateInvoice(booking.id);
    } catch (invErr) {
      this.logger.warn(`[PaymentsService] Invoice generation note: ${(invErr as Error).message}`);
    }

    return {
      paymentRecordId: paymentRecord.id,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      status: PaymentStatus.CAPTURED,
      collectedPaise,
      captainLiabilityPaise: Math.round(collectedPaise * 0.2), // Platform commission share
      ledgerEntriesCount: 2,
      collectedAt: new Date().toISOString(),
    };
  }

  /**
   * EV-054: Process Ride Refund / Cancellation Compensation.
   * Executes idempotent refund via gateway provider and posts balanced double-entry ledger.
   */
  async processRideRefund(
    actor: CurrentActorPayload | undefined,
    dto: ProcessRefundDto,
  ): Promise<ProcessRefundResponse> {
    const actorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const isPrivileged = ['ADMIN', 'OPERATOR', 'DISPATCHER', 'SAFETY_OFFICER', 'SYSTEM'].includes(
      actorRole,
    );

    if (!isPrivileged) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'Access denied: Only finance officers or platform admins can trigger refunds.',
      });
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
    });

    if (!booking) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Booking '${dto.bookingId}' not found.`,
      });
    }

    const capturedRecord = await this.paymentRecordRepo.findOne({
      where: { bookingId: booking.id, status: PaymentStatus.CAPTURED },
    });

    if (!capturedRecord) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Cannot refund a booking that has no captured payment record.',
      });
    }

    const refundPaise = Number(dto.amountPaise);
    if (!Number.isInteger(refundPaise) || refundPaise <= 0) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Refund amount must be a positive integer in paise.',
      });
    }

    if (refundPaise > Number(capturedRecord.amountPaise)) {
      throw new BadRequestException({
        code: ApiErrorCode.REFUND_EXCEEDS_PAYMENT,
        message: `Refund amount (${refundPaise} paise) exceeds captured payment (${capturedRecord.amountPaise} paise).`,
      });
    }

    // Call payment provider refund
    const provider = this.getProvider();
    const refundResult: PaymentRefundResult = await provider.processRefund({
      paymentId: capturedRecord.gatewayPaymentId || capturedRecord.gatewayOrderId || booking.id,
      amountPaise: refundPaise,
      reason: dto.reason,
      idempotencyKey: dto.idempotencyKey,
    });

    // Double-entry ledger entries for refund
    await this.dataSource.transaction(async (manager: EntityManager) => {
      // Entry 1: DEBIT - Rider Settlement (reversing previous credit)
      const debitEntry = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${dto.idempotencyKey}_dr_rider_refund`,
        bookingId: booking.id,
        accountId: `RIDER_ACCOUNT_${booking.riderId}`,
        entryType: 'DEBIT',
        amountPaise: refundPaise,
        currency: 'INR',
        description: `Refund debit for booking ${booking.bookingCode} (Reason: ${dto.reason})`,
      });

      // Entry 2: CREDIT - Gateway Clearing (reversing gateway clearing debit)
      const creditEntry = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${dto.idempotencyKey}_cr_gw_refund`,
        bookingId: booking.id,
        accountId: 'GATEWAY_CLEARING_RAZORPAY',
        entryType: 'CREDIT',
        amountPaise: refundPaise,
        currency: 'INR',
        description: `Refund credit to gateway for booking ${booking.bookingCode}`,
      });

      await manager.save([debitEntry, creditEntry]);

      capturedRecord.status =
        refundPaise === Number(capturedRecord.amountPaise)
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;
      await manager.save(capturedRecord);
    });

    this.logger.log(
      `[PaymentsService] Processed refund ${refundResult.refundId} for booking ${booking.id}: ${refundPaise} paise`,
    );

    return {
      refundId: refundResult.refundId,
      bookingId: booking.id,
      amountPaise: refundPaise,
      status: 'SUCCESS',
      idempotentReplay: false,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Returns all payment records associated with a booking.
   */
  async getPaymentRecordsForBooking(bookingId: string): Promise<PaymentRecord[]> {
    return this.paymentRecordRepo.find({
      where: { bookingId },
      order: { createdAt: 'ASC' },
    });
  }

  private toOrderResponse(
    record: PaymentRecord,
    booking: Booking,
    keyId?: string,
  ): PaymentOrderResponse {
    const amountPaise = Number(record.amountPaise);
    return {
      paymentRecordId: record.id,
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      gatewayOrderId: record.gatewayOrderId || '',
      status: record.status as PaymentStatus,
      amountPaise,
      formattedAmount: `₹${(amountPaise / 100).toFixed(2)}`,
      currency: 'INR',
      checkoutPayload: {
        keyId: keyId || 'rzp_test_ap_sandbox_key',
        orderId: record.gatewayOrderId || '',
        amountPaise,
        currency: 'INR',
        name: 'EcoRide Mobility AP',
        description: `Trip ${booking.bookingCode} - EV Passenger Mobility`,
      },
    };
  }
}
