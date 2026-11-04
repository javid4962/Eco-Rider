/**
 * EcoRide Authoritative Payment, Ledger, and Invoicing Contracts (EV-049 – EV-054)
 * Strict integer paise accounting, Andhra Pradesh GST statutory rates,
 * double-entry ledger parity, and Razorpay webhook payload specifications.
 */

export enum PaymentMethod {
  RAZORPAY_TEST = 'RAZORPAY_TEST',
  UPI = 'UPI',
  CASH = 'CASH',
  WALLET = 'WALLET',
  NETBANKING = 'NETBANKING',
  CARD = 'CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  ORDER_CREATED = 'ORDER_CREATED',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentGatewayType {
  RAZORPAY = 'RAZORPAY',
  CASH = 'CASH',
  MOCK = 'MOCK',
}

export interface CreatePaymentOrderDto {
  bookingId: string;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string;
}

export interface PaymentOrderResponse {
  paymentRecordId: string;
  bookingId: string;
  bookingCode: string;
  gatewayOrderId: string;
  status: PaymentStatus;
  amountPaise: number;
  formattedAmount: string;
  currency: 'INR';
  checkoutPayload: {
    keyId: string;
    orderId: string;
    amountPaise: number;
    currency: 'INR';
    name: string;
    description: string;
  };
}

export interface RazorpayWebhookDto {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        email?: string;
        contact?: string;
        notes?: Record<string, string>;
        error_code?: string | null;
        error_description?: string | null;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        receipt?: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        currency: string;
        status: string;
        notes?: Record<string, string>;
      };
    };
  };
  created_at: number;
}

export interface WebhookIngestResponse {
  success: boolean;
  event: string;
  paymentRecordId?: string;
  status: string;
  idempotentReplay: boolean;
  message: string;
}

export interface TaxInvoiceDto {
  invoiceNumber: string;
  bookingId: string;
  bookingCode: string;
  riderId: string;
  invoiceDate: string;
  sacCode: '996412';
  supplierGstin: string;
  supplierState: 'Andhra Pradesh';
  supplierStateCode: '37';
  placeOfSupply: string;
  baseFarePaise: number;
  cgstPaise: number; // 2.5%
  sgstPaise: number; // 2.5%
  totalTaxPaise: number; // 5.0%
  totalAmountPaise: number;
  formattedTotal: string;
  currency: 'INR';
}

export interface RecordCashPaymentDto {
  bookingId: string;
  collectedPaise: number;
  idempotencyKey?: string;
  notes?: string;
}

export interface RecordCashPaymentResponse {
  paymentRecordId: string;
  bookingId: string;
  bookingCode: string;
  status: PaymentStatus;
  collectedPaise: number;
  captainLiabilityPaise: number;
  ledgerEntriesCount: number;
  collectedAt: string;
}

export interface ProcessRefundDto {
  bookingId: string;
  amountPaise: number;
  reason: string;
  idempotencyKey: string;
}

export interface ProcessRefundResponse {
  refundId: string;
  bookingId: string;
  amountPaise: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  idempotentReplay: boolean;
  processedAt: string;
}

