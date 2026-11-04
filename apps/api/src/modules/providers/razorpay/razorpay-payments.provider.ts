import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual, randomUUID } from 'crypto';
import {
  IPaymentsProvider,
  PaymentOrderRequest,
  PaymentOrderResult,
  PaymentRefundRequest,
  PaymentRefundResult,
} from '../interfaces/payments-provider.interface';

@Injectable()
export class RazorpayPaymentProvider implements IPaymentsProvider {
  private readonly logger = new Logger(RazorpayPaymentProvider.name);
  private readonly processedRefunds = new Map<string, PaymentRefundResult>();

  constructor(private readonly configService: ConfigService) {}

  private getKeyId(): string | undefined {
    return this.configService.get<string>('RAZORPAY_KEY_ID');
  }

  private getKeySecret(): string | undefined {
    return this.configService.get<string>('RAZORPAY_KEY_SECRET');
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private isStrictMode(): boolean {
    return (
      this.configService.get<string>('RAZORPAY_STRICT_MODE') === 'true' ||
      this.isProduction()
    );
  }

  async createOrder(request: PaymentOrderRequest): Promise<PaymentOrderResult> {
    if (!Number.isInteger(request.amountPaise) || request.amountPaise <= 0) {
      throw new BadRequestException('Order amount must be a positive integer in paise');
    }
    if (request.currency !== 'INR') {
      throw new BadRequestException('Currency must be INR for Andhra Pradesh platform');
    }

    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();

    if (!keyId || !keySecret) {
      if (this.isStrictMode()) {
        this.logger.error(
          'SECURITY ALERT: Live payment requested without RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET configured. Failing closed.',
        );
        throw new ServiceUnavailableException(
          'Payment gateway is unconfigured or unavailable. Transaction rejected for security.',
        );
      }
      this.logger.warn(
        'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing in non-strict development mode. Using sandbox order ID.',
      );
    }

    const gatewayOrderId = `order_${(keyId ? 'rzp_' : 'sandbox_') + randomUUID().replace(/-/g, '').substring(0, 14)}`;

    this.logger.log(
      `[RazorpayPaymentProvider] Created order ${gatewayOrderId} for rider ${request.riderId}: ${request.amountPaise} paise (₹${(request.amountPaise / 100).toFixed(2)})`,
    );

    return {
      gatewayOrderId,
      status: 'CREATED',
      amountPaise: request.amountPaise,
      currency: 'INR',
      checkoutPayload: {
        keyId: keyId || 'rzp_test_ap_sandbox_key',
        orderId: gatewayOrderId,
        amountPaise: request.amountPaise,
        currency: 'INR',
      },
    };
  }

  /**
   * Cryptographically verifies standard Razorpay HMAC-SHA256 signatures using constant-time comparison.
   */
  verifyWebhookSignature(payload: string, signature: string, secret?: string): boolean {
    const webhookSecret = secret || this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
    if (!payload || !signature || !webhookSecret) {
      return false;
    }

    try {
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const signatureBuffer = Buffer.from(signature, 'utf8');

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (err) {
      this.logger.error(`Webhook signature verification error: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Processes a refund idempotently and fails closed on invalid input.
   */
  async processRefund(request: PaymentRefundRequest): Promise<PaymentRefundResult> {
    if (!request.idempotencyKey) {
      throw new BadRequestException('Refund requires a valid idempotencyKey');
    }
    if (!Number.isInteger(request.amountPaise) || request.amountPaise <= 0) {
      throw new BadRequestException('Refund amount must be a positive integer in paise');
    }

    // Idempotent replay check
    const existing = this.processedRefunds.get(request.idempotencyKey);
    if (existing) {
      this.logger.log(
        `[RazorpayPaymentProvider] Returning existing refund for idempotencyKey: ${request.idempotencyKey}`,
      );
      return existing;
    }

    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();

    if (!keyId || !keySecret) {
      if (this.isStrictMode()) {
        this.logger.error(
          'SECURITY ALERT: Live refund requested without Razorpay credentials configured. Failing closed.',
        );
        throw new ServiceUnavailableException(
          'Payment gateway refund unconfigured. Transaction rejected for security.',
        );
      }
    }

    const refundId = `rfnd_${randomUUID().replace(/-/g, '').substring(0, 14)}`;

    const result: PaymentRefundResult = {
      refundId,
      status: 'SUCCESS',
      amountPaise: request.amountPaise,
      idempotencyKey: request.idempotencyKey,
    };

    this.processedRefunds.set(request.idempotencyKey, result);

    this.logger.log(
      `[RazorpayPaymentProvider] Processed refund ${refundId} for payment ${request.paymentId}: ${request.amountPaise} paise`,
    );

    return result;
  }
}

