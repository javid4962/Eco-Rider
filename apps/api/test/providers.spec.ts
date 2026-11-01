import { MockMapsProvider } from '../src/modules/providers/mock/mock-maps.provider';
import { MockOtpProvider } from '../src/modules/providers/mock/mock-otp.provider';
import { MockPaymentsProvider } from '../src/modules/providers/mock/mock-payments.provider';
import { MockSmsProvider } from '../src/modules/providers/mock/mock-sms.provider';
import { MockPushProvider } from '../src/modules/providers/mock/mock-push.provider';
import { createHmac } from 'crypto';

describe('External Provider Mock Adapters (EV-012)', () => {
  describe('MockMapsProvider', () => {
    let mapsProvider: MockMapsProvider;

    beforeEach(() => {
      mapsProvider = new MockMapsProvider();
    });

    it('should calculate realistic distance, duration, and EV energy consumption', async () => {
      // Dwaraka Nagar RTC Complex -> RK Beach (Visakhapatnam)
      const origin = { latitude: 17.7275, longitude: 83.3038 };
      const destination = { latitude: 17.7142, longitude: 83.3235 };

      const result = await mapsProvider.calculateDistanceMatrix(origin, destination);

      expect(result.distanceMeters).toBeGreaterThan(2000);
      expect(result.distanceMeters).toBeLessThan(6000);
      expect(result.durationSeconds).toBeGreaterThan(120);
      expect(result.estimatedConsumptionKwh).toBeGreaterThan(0.1);
      expect(result.estimatedConsumptionKwh).toBeLessThan(1.0);
    });

    it('should generate synthetic route polyline with step points', async () => {
      const origin = { latitude: 17.7275, longitude: 83.3038 };
      const destination = { latitude: 17.7412, longitude: 83.3371 };

      const route = await mapsProvider.getRoute(origin, destination);

      expect(route.encodedPolyline).toContain('mock_poly_');
      expect(route.points.length).toBe(6);
      expect(route.points[0].latitude).toBe(17.7275);
      expect(route.points[5].latitude).toBe(17.7412);
    });

    it('should reverse geocode known Andhra Pradesh landmarks', async () => {
      const rkBeach = { latitude: 17.7145, longitude: 83.3230 };
      const address = await mapsProvider.reverseGeocode(rkBeach);

      expect(address).toContain('RK Beach, Visakhapatnam');
    });

    it('should accurately test point-in-polygon containment', () => {
      const polygon = [
        { latitude: 17.7000, longitude: 83.3000 },
        { latitude: 17.7500, longitude: 83.3000 },
        { latitude: 17.7500, longitude: 83.3500 },
        { latitude: 17.7000, longitude: 83.3500 },
      ];

      const insidePoint = { latitude: 17.7250, longitude: 83.3250 };
      const outsidePoint = { latitude: 17.8000, longitude: 83.4000 };

      expect(mapsProvider.isPointInPolygon(insidePoint, polygon)).toBe(true);
      expect(mapsProvider.isPointInPolygon(outsidePoint, polygon)).toBe(false);
    });
  });

  describe('MockOtpProvider', () => {
    let otpProvider: MockOtpProvider;

    beforeEach(() => {
      otpProvider = new MockOtpProvider();
    });

    it('should generate 4-digit code for RIDE_START and 6-digit code for LOGIN without hardcoded bypass', async () => {
      const riderPhone = '+919123400001';
      const captainPhone = '+919123400011';

      const rideStartResult = await otpProvider.sendOtp(riderPhone, 'RIDE_START');
      const loginResult = await otpProvider.sendOtp(captainPhone, 'LOGIN');

      expect(rideStartResult.referenceId).toBeDefined();
      expect(rideStartResult.deliveryChannel).toBe('SMS');
      expect(loginResult.referenceId).toBeDefined();
      expect(loginResult.deliveryChannel).toBe('SMS');

      const rideStartOtp = otpProvider.getActiveOtpForTesting(riderPhone, 'RIDE_START');
      const loginOtp = otpProvider.getActiveOtpForTesting(captainPhone, 'LOGIN');

      expect(rideStartOtp).toBeDefined();
      expect(rideStartOtp).toMatch(/^\d{4}$/); // Exactly 4 digits

      expect(loginOtp).toBeDefined();
      expect(loginOtp).toMatch(/^\d{6}$/); // Exactly 6 digits
    });

    it('should verify correct OTP and evict it single-use', async () => {
      const phone = '+919123400002';
      await otpProvider.sendOtp(phone, 'LOGIN');
      const activeOtp = otpProvider.getActiveOtpForTesting(phone, 'LOGIN')!;

      // 1. Successful verification
      const verifySuccess = await otpProvider.verifyOtp(phone, activeOtp);
      expect(verifySuccess.valid).toBe(true);

      // 2. Replay should fail due to single-use eviction
      const replayResult = await otpProvider.verifyOtp(phone, activeOtp);
      expect(replayResult.valid).toBe(false);
      expect(replayResult.reason).toBe('OTP_NOT_FOUND_OR_EXPIRED');
    });

    it('should reject invalid code and throttle after 3 attempts', async () => {
      const phone = '+919123400003';
      await otpProvider.sendOtp(phone, 'LOGIN');

      // Attempt 1: wrong code
      const res1 = await otpProvider.verifyOtp(phone, '000000');
      expect(res1.valid).toBe(false);
      expect(res1.reason).toBe('INVALID_OTP_CODE');

      // Attempt 2: wrong code
      const res2 = await otpProvider.verifyOtp(phone, '111111');
      expect(res2.valid).toBe(false);

      // Attempt 3: wrong code
      const res3 = await otpProvider.verifyOtp(phone, '222222');
      expect(res3.valid).toBe(false);

      // Attempt 4: should be throttled
      const res4 = await otpProvider.verifyOtp(phone, '333333');
      expect(res4.valid).toBe(false);
      expect(res4.reason).toBe('MAX_ATTEMPTS_EXCEEDED');
    });
  });

  describe('MockPaymentsProvider', () => {
    let paymentsProvider: MockPaymentsProvider;

    beforeEach(() => {
      paymentsProvider = new MockPaymentsProvider();
    });

    it('should create payment order with integer paise and INR currency', async () => {
      const order = await paymentsProvider.createOrder({
        orderId: 'ORD-VIZAG-001',
        amountPaise: 15000, // ₹150.00
        currency: 'INR',
        riderId: 'a0000001-0000-0000-0000-000000000001',
        description: 'Visakhapatnam EV ride fare',
      });

      expect(order.gatewayOrderId).toContain('mock_order_');
      expect(order.status).toBe('CREATED');
      expect(order.amountPaise).toBe(15000);
      expect(order.currency).toBe('INR');
      expect(order.checkoutPayload.keyId).toBe('mock_key_test_ap_mobility');
    });

    it('should reject non-positive or floating paise amounts', async () => {
      await expect(
        paymentsProvider.createOrder({
          orderId: 'ORD-INVALID',
          amountPaise: 150.5,
          currency: 'INR',
          riderId: 'a0000001',
          description: 'invalid amount',
        }),
      ).rejects.toThrow('Order amount must be a positive integer in paise');
    });

    it('should verify webhook HMAC-SHA256 signature correctly', () => {
      const secret = 'webhook_secret_vizag_pilot';
      const payload = JSON.stringify({ event: 'payment.captured', id: 'pay_123' });
      const validSignature = createHmac('sha256', secret).update(payload).digest('hex');

      expect(paymentsProvider.verifyWebhookSignature(payload, validSignature, secret)).toBe(true);
      expect(paymentsProvider.verifyWebhookSignature(payload, 'tampered_signature', secret)).toBe(false);
    });

    it('should enforce idempotency on refund processing', async () => {
      const refundReq = {
        paymentId: 'pay_demo_987',
        amountPaise: 8500,
        reason: 'Rider cancelled before captain arrived',
        idempotencyKey: 'idemp_ref_unique_12345',
      };

      const firstCall = await paymentsProvider.processRefund(refundReq);
      expect(firstCall.status).toBe('SUCCESS');
      expect(firstCall.amountPaise).toBe(8500);

      // Replay with exact same idempotency key
      const secondCall = await paymentsProvider.processRefund(refundReq);
      expect(secondCall.refundId).toBe(firstCall.refundId);
      expect(secondCall.idempotencyKey).toBe(refundReq.idempotencyKey);
    });
  });

  describe('MockSmsProvider', () => {
    let smsProvider: MockSmsProvider;

    beforeEach(() => {
      smsProvider = new MockSmsProvider();
    });

    it('should record and deliver transactional SMS in English and Telugu', async () => {
      const resultTe = await smsProvider.sendSms({
        toPhone: '+919123400001',
        message: 'మీ EcoRide డ్రైవర్ బయలుదేరారు. OTP: 4821',
        language: 'te',
        correlationId: 'trace-sms-001',
      });

      expect(resultTe.delivered).toBe(true);
      expect(resultTe.carrierStatus).toContain('DELIVERED');

      const sent = smsProvider.getSentMessages();
      expect(sent.length).toBe(1);
      expect(sent[0].message).toContain('OTP: 4821');
      expect(sent[0].language).toBe('te');
    });
  });

  describe('MockPushProvider', () => {
    let pushProvider: MockPushProvider;

    beforeEach(() => {
      pushProvider = new MockPushProvider();
    });

    it('should dispatch unicast and multicast push notifications without remote cloud network', async () => {
      const unicastResult = await pushProvider.sendNotification({
        recipientToken: 'fcm_token_captain_srinivas',
        userId: 'b0000001-0000-0000-0000-000000000011',
        title: 'New EV Ride Request Nearby',
        body: 'MVP Colony to RK Beach (₹85.00)',
      });

      expect(unicastResult.delivered).toBe(true);

      const multicastResult = await pushProvider.sendMulticast(
        ['token_1', 'token_2', 'token_3'],
        'Low Battery Alert',
        'Please recharge at nearest Visakhapatnam EV charging station',
      );

      expect(multicastResult.successCount).toBe(3);
      expect(pushProvider.getDispatchedNotifications().length).toBe(4);
    });
  });
});

