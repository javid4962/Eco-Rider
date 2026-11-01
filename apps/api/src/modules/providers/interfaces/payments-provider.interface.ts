export interface PaymentOrderRequest {
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  riderId: string;
  description: string;
}

export interface PaymentOrderResult {
  gatewayOrderId: string;
  status: 'CREATED' | 'PAID' | 'FAILED';
  amountPaise: number;
  currency: 'INR';
  checkoutPayload: {
    keyId: string;
    orderId: string;
    amountPaise: number;
    currency: 'INR';
  };
}

export interface PaymentRefundRequest {
  paymentId: string;
  amountPaise: number;
  reason: string;
  idempotencyKey: string;
}

export interface PaymentRefundResult {
  refundId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  amountPaise: number;
  idempotencyKey: string;
}

export interface IPaymentsProvider {
  createOrder(request: PaymentOrderRequest): Promise<PaymentOrderResult>;
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;
  processRefund(request: PaymentRefundRequest): Promise<PaymentRefundResult>;
}

