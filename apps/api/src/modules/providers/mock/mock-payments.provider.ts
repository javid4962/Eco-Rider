import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
import {
  IPaymentsProvider,
  PaymentOrderRequest,
  PaymentOrderResult,
  PaymentRefundRequest,
  PaymentRefundResult,
} from '../interfaces/payments-provider.interface';

@Injectable()
export class MockPaymentsProvider implements IPaymentsProvider {
  private readonly logger = new Logger(MockPaymentsProvider.name);
  private readonly processedRefunds = new Map<string, PaymentRefundResult>();

  async createOrder(request: PaymentOrderRequest): Promise<PaymentOrderResult> {
    if (!Number.isInteger(request.amountPaise) || request.amountPaise <= 0) {
      throw new BadRequestException('Order amount must be a positive integer in paise');
    }
    if (request.currency !== 'INR') {
      throw new BadRequestException('Currency must be INR for Andhra Pradesh platform');
    }

    const gatewayOrderId = `mock_order_${randomUUID().substring(0, 12)}`;

    this.logger.log(
      `[MockPaymentsProvider] Created mock order ${gatewayOrderId} for rider ${request.riderId}: ${request.amountPaise} paise (₹${(request.amountPaise / 100).toFixed(2)})`,
    );

    return {
      gatewayOrderId,
      status: 'CREATED',
      amountPaise: request.amountPaise,
      currency: 'INR',
      checkoutPayload: {
        keyId: 'mock_key_test_ap_mobility',
        orderId: gatewayOrderId,
        amountPaise: request.amountPaise,
        currency: 'INR',
      },
    };
  }

  /**
   * Verifies standard HMAC-SHA256 payment gateway webhook signatures.
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!payload || !signature || !secret) {
      return false;
    }
    try {
      const expectedSignature = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      return expectedSignature === signature;
    } catch {
      return false;
    }
  }

  /**
   * Processes mock refund with idempotent replay protection.
   */
  async processRefund(request: PaymentRefundRequest): Promise<PaymentRefundResult> {
    if (!request.idempotencyKey) {
      throw new BadRequestException('Refund requires a valid idempotencyKey');
    }
    if (!Number.isInteger(request.amountPaise) || request.amountPaise <= 0) {
      throw new BadRequestException('Refund amount must be a positive integer in paise');
    }

    // Idempotent replay check
    if (this.processedRefunds.has(request.idempotencyKey)) {
      this.logger.log(
        `[MockPaymentsProvider] Returning cached refund for idempotencyKey: ${request.idempotencyKey}`,
      );
      return this.processedRefunds.get(request.idempotencyKey)!;
    }

    const refundId = `mock_ref_${randomUUID().substring(0, 12)}`;
    const result: PaymentRefundResult = {
      refundId,
      status: 'SUCCESS',
      amountPaise: request.amountPaise,
      idempotencyKey: request.idempotencyKey,
    };

    this.processedRefunds.set(request.idempotencyKey, result);

    this.logger.log(
      `[MockPaymentsProvider] Processed refund ${refundId} for payment ${request.paymentId}: ${request.amountPaise} paise (₹${(request.amountPaise / 100).toFixed(2)})`,
    );

    return result;
  }
}

