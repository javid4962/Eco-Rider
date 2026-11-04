import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { createHmac } from 'crypto';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { InvoicesService } from '../src/modules/payments/invoices.service';
import { PaymentsController } from '../src/modules/payments/payments.controller';
import { PaymentRecord } from '../src/database/entities/payment-record.entity';
import { TaxInvoice } from '../src/database/entities/tax-invoice.entity';
import { Booking } from '../src/database/entities/booking.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import { RAZORPAY_PAYMENT_PROVIDER, PAYMENTS_PROVIDER } from '../src/modules/providers/providers.constants';
import { RazorpayPaymentProvider } from '../src/modules/providers/razorpay/razorpay-payments.provider';
import { MockPaymentsProvider } from '../src/modules/providers/mock/mock-payments.provider';
import {
  PaymentStatus,
  PaymentGatewayType,
  PaymentMethod,
  RideStatus,
} from '@ecoride/contracts';

function generateSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

describe('Milestone M05: Payments & Ledger (EV-049 – EV-054)', () => {
  let paymentsService: PaymentsService;
  let invoicesService: InvoicesService;
  let paymentsController: PaymentsController;

  const mockWebhookSecret = 'test_ap_webhook_secret_key_12345';

  const mockBooking: Partial<Booking> = {
    id: 'a1000000-0000-0000-0000-000000000001',
    bookingCode: 'ECO-AP-2026-001',
    riderId: 'r1000000-0000-0000-0000-000000000001',
    captainId: 'c1000000-0000-0000-0000-000000000001',
    status: RideStatus.COMPLETED,
    fareAmount: 105.0, // ₹105.00 => 10500 paise
    tripCompletedAt: new Date('2026-11-04T12:00:00Z'),
  };

  const storedPaymentRecords: PaymentRecord[] = [];
  const storedTaxInvoices: TaxInvoice[] = [];
  const storedLedgerEntries: LedgerEntry[] = [];

  const mockPaymentRecordRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedPaymentRecords.find((r) => {
        for (const key of Object.keys(where)) {
          if ((r as unknown as Record<string, unknown>)[key] !== where[key]) {
            return false;
          }
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedPaymentRecords.filter((r) => {
        for (const key of Object.keys(where)) {
          if ((r as unknown as Record<string, unknown>)[key] !== where[key]) {
            return false;
          }
        }
        return true;
      });
    }),
    create: jest.fn().mockImplementation((data: Partial<PaymentRecord>) => {
      const record = {
        id: 'payrec_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: PaymentStatus.PENDING,
        amountPaise: 0,
        currency: 'INR',
        gateway: PaymentGatewayType.RAZORPAY,
        ...data,
      } as PaymentRecord;
      return record;
    }),
    save: jest.fn().mockImplementation(async (data: PaymentRecord | PaymentRecord[]) => {
      if (Array.isArray(data)) {
        for (const item of data) {
          const idx = storedPaymentRecords.findIndex((r) => r.id === item.id);
          if (idx >= 0) storedPaymentRecords[idx] = item;
          else storedPaymentRecords.push(item);
        }
        return data;
      }
      const idx = storedPaymentRecords.findIndex((r) => r.id === data.id);
      if (idx >= 0) storedPaymentRecords[idx] = data;
      else storedPaymentRecords.push(data);
      return data;
    }),
  };

  const mockTaxInvoiceRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedTaxInvoices.find((inv) => {
        for (const key of Object.keys(where)) {
          if ((inv as unknown as Record<string, unknown>)[key] !== where[key]) {
            return false;
          }
        }
        return true;
      }) || null;
    }),
    create: jest.fn().mockImplementation((data: Partial<TaxInvoice>) => {
      return {
        id: 'inv_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as TaxInvoice;
    }),
    save: jest.fn().mockImplementation(async (invoice: TaxInvoice) => {
      storedTaxInvoices.push(invoice);
      return invoice;
    }),
  };

  const mockBookingRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: { id: string } }) => {
      if (criteria.where.id === mockBooking.id) {
        return mockBooking as Booking;
      }
      return null;
    }),
  };

  const mockLedgerEntryRepo = {
    save: jest.fn().mockImplementation(async (entries: LedgerEntry[]) => {
      storedLedgerEntries.push(...entries);
      return entries;
    }),
  };

  const mockEntityManager: Partial<EntityManager> = {
    create: jest.fn().mockImplementation((_entityClass: unknown, plainObj: Record<string, unknown>) => ({
      ...plainObj,
    })),
    save: jest.fn().mockImplementation(async (target: unknown) => {
      if (Array.isArray(target)) {
        for (const item of target) {
          if (item.entryType) {
            storedLedgerEntries.push(item as LedgerEntry);
          } else if (item.gateway) {
            const idx = storedPaymentRecords.findIndex((r) => r.id === item.id);
            if (idx >= 0) storedPaymentRecords[idx] = item;
            else storedPaymentRecords.push(item);
          }
        }
        return target;
      }
      const record = target as PaymentRecord;
      if (record?.gateway) {
        const idx = storedPaymentRecords.findIndex((r) => r.id === record.id);
        if (idx >= 0) storedPaymentRecords[idx] = record;
        else storedPaymentRecords.push(record);
      }
      return target;
    }),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb: (manager: EntityManager) => Promise<unknown>) => {
      return cb(mockEntityManager as EntityManager);
    }),
  };

  beforeEach(async () => {
    storedPaymentRecords.length = 0;
    storedTaxInvoices.length = 0;
    storedLedgerEntries.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        PaymentsService,
        InvoicesService,
        {
          provide: getRepositoryToken(PaymentRecord),
          useValue: mockPaymentRecordRepo,
        },
        {
          provide: getRepositoryToken(TaxInvoice),
          useValue: mockTaxInvoiceRepo,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepo,
        },
        {
          provide: getRepositoryToken(LedgerEntry),
          useValue: mockLedgerEntryRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: RAZORPAY_PAYMENT_PROVIDER,
          useClass: RazorpayPaymentProvider,
        },
        {
          provide: PAYMENTS_PROVIDER,
          useClass: MockPaymentsProvider,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'RAZORPAY_KEY_ID') return 'rzp_test_ap_corridor_key';
              if (key === 'RAZORPAY_KEY_SECRET') return 'rzp_test_secret_corridor';
              if (key === 'RAZORPAY_WEBHOOK_SECRET') return mockWebhookSecret;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
    invoicesService = module.get<InvoicesService>(InvoicesService);
    paymentsController = module.get<PaymentsController>(PaymentsController);
  });

  describe('EV-049: Razorpay Order Creation', () => {
    it('should create a Razorpay payment order with positive integer paise and INR currency', async () => {
      const actor = {
        id: mockBooking.riderId!,
        role: 'RIDER',
        scopes: [],
      };

      const result = await paymentsService.createRidePaymentOrder(
        mockBooking.id!,
        actor,
        { bookingId: mockBooking.id!, paymentMethod: PaymentMethod.RAZORPAY_TEST },
      );

      expect(result).toBeDefined();
      expect(result.amountPaise).toBe(10500); // ₹105.00 = 10500 paise
      expect(result.currency).toBe('INR');
      expect(result.formattedAmount).toBe('₹105.00');
      expect(result.status).toBe(PaymentStatus.ORDER_CREATED);
      expect(result.gatewayOrderId).toMatch(/^order_/);
      expect(result.checkoutPayload.keyId).toBeDefined();
    });

    it('should reject unauthorized cross-rider order creation', async () => {
      const maliciousActor = {
        id: 'attacker-uuid-9999',
        role: 'RIDER',
        scopes: [],
      };

      await expect(
        paymentsService.createRidePaymentOrder(mockBooking.id!, maliciousActor, {
          bookingId: mockBooking.id!,
        }),
      ).rejects.toThrow();
    });

    it('should reject order creation if payment is already captured for the ride', async () => {
      const actor = {
        id: mockBooking.riderId!,
        role: 'RIDER',
        scopes: [],
      };

      // Seed captured record
      storedPaymentRecords.push({
        id: 'payrec_captured_1',
        bookingId: mockBooking.id!,
        riderId: mockBooking.riderId!,
        gateway: PaymentGatewayType.RAZORPAY,
        gatewayOrderId: 'order_already_paid',
        status: PaymentStatus.CAPTURED,
        amountPaise: 10500,
        currency: 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PaymentRecord);

      await expect(
        paymentsService.createRidePaymentOrder(mockBooking.id!, actor, {
          bookingId: mockBooking.id!,
        }),
      ).rejects.toThrow();
    });
  });

  describe('EV-050: Razorpay Webhook Ingestion & Signature Verification', () => {
    it('should successfully verify valid HMAC-SHA256 signature and capture payment', async () => {
      // Seed order record
      const orderId = 'order_test_hook_001';
      storedPaymentRecords.push({
        id: 'payrec_hook_001',
        bookingId: mockBooking.id!,
        riderId: mockBooking.riderId!,
        gateway: PaymentGatewayType.RAZORPAY,
        gatewayOrderId: orderId,
        status: PaymentStatus.ORDER_CREATED,
        amountPaise: 10500,
        currency: 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PaymentRecord);

      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_capture_test_123',
              order_id: orderId,
              amount: 10500,
              currency: 'INR',
              status: 'captured',
              method: 'upi',
            },
          },
        },
        created_at: Math.floor(Date.now() / 1000),
      });

      const signature = generateSignature(webhookPayload, mockWebhookSecret);

      const response = await paymentsService.handleRazorpayWebhook(
        webhookPayload,
        signature,
        mockWebhookSecret,
      );

      expect(response.success).toBe(true);
      expect(response.status).toBe(PaymentStatus.CAPTURED);
      expect(response.idempotentReplay).toBe(false);

      const updatedRecord = storedPaymentRecords.find((r) => r.gatewayOrderId === orderId);
      expect(updatedRecord?.status).toBe(PaymentStatus.CAPTURED);
      expect(updatedRecord?.gatewayPaymentId).toBe('pay_capture_test_123');
      expect(updatedRecord?.paymentMethod).toBe('UPI');
    });

    it('should reject webhook with forged or invalid signature', async () => {
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_fake', order_id: 'order_fake', amount: 1000 } } },
      });

      const forgedSignature = 'forged_deadbeef_signature_0000000000000000000000000000000000000000000000000000000000000000';

      await expect(
        paymentsService.handleRazorpayWebhook(webhookPayload, forgedSignature, mockWebhookSecret),
      ).rejects.toThrow();
    });

    it('should handle webhook idempotency and not duplicate ledger entries on replay', async () => {
      const orderId = 'order_test_replay_002';
      storedPaymentRecords.push({
        id: 'payrec_replay_002',
        bookingId: mockBooking.id!,
        riderId: mockBooking.riderId!,
        gateway: PaymentGatewayType.RAZORPAY,
        gatewayOrderId: orderId,
        status: PaymentStatus.CAPTURED, // Already captured
        amountPaise: 10500,
        currency: 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PaymentRecord);

      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_replay_123',
              order_id: orderId,
              amount: 10500,
            },
          },
        },
        created_at: Math.floor(Date.now() / 1000),
      });

      const signature = generateSignature(webhookPayload, mockWebhookSecret);

      const initialLedgerCount = storedLedgerEntries.length;

      const response = await paymentsService.handleRazorpayWebhook(
        webhookPayload,
        signature,
        mockWebhookSecret,
      );

      expect(response.success).toBe(true);
      expect(response.idempotentReplay).toBe(true);
      expect(storedLedgerEntries.length).toBe(initialLedgerCount); // No new ledger entries!
    });
  });

  describe('EV-051: Double-Entry Immutable Ledger Parity', () => {
    it('should enforce balanced double-entry ledger entries upon payment capture', async () => {
      const orderId = 'order_ledger_parity_003';
      storedPaymentRecords.push({
        id: 'payrec_parity_003',
        bookingId: mockBooking.id!,
        riderId: mockBooking.riderId!,
        gateway: PaymentGatewayType.RAZORPAY,
        gatewayOrderId: orderId,
        status: PaymentStatus.ORDER_CREATED,
        amountPaise: 10500,
        currency: 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PaymentRecord);

      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_parity_123',
              order_id: orderId,
              amount: 10500,
            },
          },
        },
        created_at: Math.floor(Date.now() / 1000),
      });

      const signature = generateSignature(webhookPayload, mockWebhookSecret);
      await paymentsService.handleRazorpayWebhook(webhookPayload, signature, mockWebhookSecret);

      // Verify double-entry ledger balance
      const relatedEntries = storedLedgerEntries.filter((e) => e.bookingId === mockBooking.id);
      expect(relatedEntries.length).toBe(2);

      const totalDebits = relatedEntries
        .filter((e) => e.entryType === 'DEBIT')
        .reduce((sum, e) => sum + Number(e.amountPaise), 0);

      const totalCredits = relatedEntries
        .filter((e) => e.entryType === 'CREDIT')
        .reduce((sum, e) => sum + Number(e.amountPaise), 0);

      expect(totalDebits).toBe(10500);
      expect(totalCredits).toBe(10500);
      expect(totalDebits).toBe(totalCredits); // Exact parity!
    });
  });

  describe('EV-052: AP Statutory GST Tax Invoicing', () => {
    it('should calculate 5.0% AP intra-state GST (2.5% CGST + 2.5% SGST) and preserve exact integer paise sum', async () => {
      const invoice = await invoicesService.getOrCreateInvoice(mockBooking.id!);

      expect(invoice).toBeDefined();
      expect(invoice.sacCode).toBe('996412'); // Passenger transport by electric motor vehicles
      expect(invoice.supplierGstin).toBe('37AAAAA0000A1Z5');
      expect(invoice.supplierState).toBe('Andhra Pradesh');
      expect(invoice.supplierStateCode).toBe('37');

      // 10500 paise total => base = round(10500 / 1.05) = 10000 paise
      // totalTax = 500 paise (250 CGST + 250 SGST)
      expect(invoice.totalAmountPaise).toBe(10500);
      expect(invoice.baseFarePaise).toBe(10000);
      expect(invoice.cgstPaise).toBe(250);
      expect(invoice.sgstPaise).toBe(250);
      expect(invoice.totalTaxPaise).toBe(500);

      // Math verification: Base + CGST + SGST === Total
      expect(invoice.baseFarePaise + invoice.cgstPaise + invoice.sgstPaise).toBe(
        invoice.totalAmountPaise,
      );

      // Re-invoking returns same invoice idempotently
      const secondInvoice = await invoicesService.getOrCreateInvoice(mockBooking.id!);
      expect(secondInvoice.invoiceNumber).toBe(invoice.invoiceNumber);
      expect(storedTaxInvoices.length).toBe(1);
    });
  });

  describe('EV-053: Captain Cash Collection & Liability Reconciliation', () => {
    it('should record cash collected by assigned captain and generate balanced double-entry ledger', async () => {
      const captainActor = {
        id: mockBooking.captainId!,
        role: 'CAPTAIN',
        scopes: [],
      };

      const result = await paymentsService.recordCashPayment(captainActor, {
        bookingId: mockBooking.id!,
        collectedPaise: 10500,
        idempotencyKey: 'cash_idem_test_001',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(PaymentStatus.CAPTURED);
      expect(result.collectedPaise).toBe(10500);
      expect(result.captainLiabilityPaise).toBe(2100); // 20% platform commission = ₹21.00

      // Verify double-entry ledger entries for cash collection
      const cashEntries = storedLedgerEntries.filter(
        (e) => e.idempotencyKey.includes('cash_idem_test_001'),
      );
      expect(cashEntries.length).toBe(2);

      const debitEntry = cashEntries.find((e) => e.entryType === 'DEBIT');
      const creditEntry = cashEntries.find((e) => e.entryType === 'CREDIT');

      expect(debitEntry?.accountId).toBe(`CAPTAIN_CASH_IN_HAND_${mockBooking.captainId}`);
      expect(debitEntry?.amountPaise).toBe(10500);
      expect(creditEntry?.accountId).toBe(`RIDER_ACCOUNT_${mockBooking.riderId}`);
      expect(creditEntry?.amountPaise).toBe(10500);
    });

    it('should reject cash collection by unauthorized actor', async () => {
      const unauthorizedCaptain = {
        id: 'different_captain_uuid_7777',
        role: 'CAPTAIN',
        scopes: [],
      };

      await expect(
        paymentsService.recordCashPayment(unauthorizedCaptain, {
          bookingId: mockBooking.id!,
          collectedPaise: 10500,
        }),
      ).rejects.toThrow();
    });
  });

  describe('EV-054: Ride Refund & Cancellation Processing', () => {
    it('should process refund idempotently and create balanced double-entry refund ledger entries', async () => {
      // Seed captured payment record
      storedPaymentRecords.push({
        id: 'payrec_refund_test',
        bookingId: mockBooking.id!,
        riderId: mockBooking.riderId!,
        gateway: PaymentGatewayType.RAZORPAY,
        gatewayOrderId: 'order_to_refund',
        gatewayPaymentId: 'pay_to_refund_123',
        status: PaymentStatus.CAPTURED,
        amountPaise: 10500,
        currency: 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PaymentRecord);

      const financeActor = {
        id: 'admin_finance_001',
        role: 'ADMIN',
        scopes: [],
      };

      const refundResult = await paymentsService.processRideRefund(financeActor, {
        bookingId: mockBooking.id!,
        amountPaise: 10500,
        reason: 'Customer cancelled during allowable SLA grace window',
        idempotencyKey: 'refund_idem_001',
      });

      expect(refundResult.status).toBe('SUCCESS');
      expect(refundResult.amountPaise).toBe(10500);

      // Verify refund ledger entries: DEBIT Rider, CREDIT Gateway
      const refundEntries = storedLedgerEntries.filter(
        (e) => e.idempotencyKey.includes('refund_idem_001'),
      );
      expect(refundEntries.length).toBe(2);

      const debit = refundEntries.find((e) => e.entryType === 'DEBIT');
      const credit = refundEntries.find((e) => e.entryType === 'CREDIT');

      expect(debit?.accountId).toBe(`RIDER_ACCOUNT_${mockBooking.riderId}`);
      expect(credit?.accountId).toBe('GATEWAY_CLEARING_RAZORPAY');
      expect(debit?.amountPaise).toBe(10500);
      expect(credit?.amountPaise).toBe(10500);
    });

    it('should reject refund exceeding captured amount', async () => {
      storedPaymentRecords.push({
        id: 'payrec_refund_cap',
        bookingId: mockBooking.id!,
        riderId: mockBooking.riderId!,
        gateway: PaymentGatewayType.RAZORPAY,
        status: PaymentStatus.CAPTURED,
        amountPaise: 5000,
        currency: 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as PaymentRecord);

      const financeActor = {
        id: 'admin_finance_001',
        role: 'ADMIN',
        scopes: [],
      };

      await expect(
        paymentsService.processRideRefund(financeActor, {
          bookingId: mockBooking.id!,
          amountPaise: 15000, // Exceeds 5000
          reason: 'Excess refund attempt',
          idempotencyKey: 'refund_excess_test',
        }),
      ).rejects.toThrow();
    });
  });

  describe('PaymentsController Endpoints', () => {
    it('should route createOrder and getInvoice through PaymentsController', async () => {
      const actor = {
        id: mockBooking.riderId!,
        role: 'RIDER',
        scopes: [],
      };

      const orderRes = await paymentsController.createOrder(
        { bookingId: mockBooking.id! },
        actor,
      );
      expect(orderRes.amountPaise).toBe(10500);

      const invoiceRes = await paymentsController.getInvoice(mockBooking.id!);
      expect(invoiceRes.totalAmountPaise).toBe(10500);
      expect(invoiceRes.sacCode).toBe('996412');
    });
  });
});
