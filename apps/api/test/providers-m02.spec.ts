import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { RazorpayPaymentProvider } from '../src/modules/providers/razorpay/razorpay-payments.provider';
import { MockKycProvider } from '../src/modules/providers/mock/mock-kyc.provider';
import { SurepassKycProvider } from '../src/modules/providers/surepass/surepass-kyc.provider';
import { MockWhatsAppProvider } from '../src/modules/providers/mock/mock-whatsapp.provider';
import { GoogleMapsProvider } from '../src/modules/providers/maps/google-maps.provider';
import { MockMapsProvider } from '../src/modules/providers/mock/mock-maps.provider';

describe('Provider Architecture & Adapters (Milestone M02)', () => {
  describe('RazorpayPaymentProvider', () => {
    let provider: RazorpayPaymentProvider;
    let configService: ConfigService;

    beforeEach(() => {
      configService = new ConfigService({
        RAZORPAY_KEY_ID: 'rzp_test_ap_corridor_key',
        RAZORPAY_KEY_SECRET: 'test_secret_12345',
        RAZORPAY_WEBHOOK_SECRET: 'webhook_secret_67890',
        NODE_ENV: 'test',
        RAZORPAY_STRICT_MODE: 'false',
      });
      provider = new RazorpayPaymentProvider(configService);
    });

    it('should create valid payment order with integer paise and INR currency', async () => {
      const order = await provider.createOrder({
        orderId: 'app_ord_001',
        amountPaise: 15000, // ₹150.00
        currency: 'INR',
        riderId: 'rider_001',
        description: 'EcoRide 4W Ride Fare',
      });

      expect(order.gatewayOrderId).toBeDefined();
      expect(order.gatewayOrderId).toContain('order_rzp_');
      expect(order.status).toBe('CREATED');
      expect(order.amountPaise).toBe(15000);
      expect(order.currency).toBe('INR');
      expect(order.checkoutPayload.keyId).toBe('rzp_test_ap_corridor_key');
    });

    it('should reject invalid currency and non-integer/negative amounts', async () => {
      await expect(
        provider.createOrder({
          orderId: 'app_ord_002',
          amountPaise: 15000,
          currency: 'USD' as unknown as 'INR',
          riderId: 'rider_001',
          description: 'Invalid currency',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        provider.createOrder({
          orderId: 'app_ord_003',
          amountPaise: -500,
          currency: 'INR',
          riderId: 'rider_001',
          description: 'Negative amount',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        provider.createOrder({
          orderId: 'app_ord_004',
          amountPaise: 150.5, // float amount
          currency: 'INR',
          riderId: 'rider_001',
          description: 'Fractional paise',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail closed in strict mode if Razorpay credentials are absent', async () => {
      const strictConfig = new ConfigService({
        NODE_ENV: 'production',
        RAZORPAY_STRICT_MODE: 'true',
      });
      const strictProvider = new RazorpayPaymentProvider(strictConfig);

      await expect(
        strictProvider.createOrder({
          orderId: 'ord_prod_01',
          amountPaise: 20000,
          currency: 'INR',
          riderId: 'rider_prod_01',
          description: 'Production ride without keys',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should cryptographically verify webhook signatures with timingSafeEqual', () => {
      const payload = JSON.stringify({ event: 'payment.captured', id: 'pay_123' });
      const secret = 'webhook_secret_67890';
      const validSignature = createHmac('sha256', secret).update(payload).digest('hex');

      expect(provider.verifyWebhookSignature(payload, validSignature, secret)).toBe(true);

      const invalidSignature = 'invalid_signature_hex_value_00000000000000000000000000000000';
      expect(provider.verifyWebhookSignature(payload, invalidSignature, secret)).toBe(false);
      expect(provider.verifyWebhookSignature(payload, 'tampered', secret)).toBe(false);
    });

    it('should process refunds idempotently', async () => {
      const refundReq = {
        paymentId: 'pay_12345',
        amountPaise: 8500,
        reason: 'Driver cancelled ride',
        idempotencyKey: 'idemp_refund_test_001',
      };

      const res1 = await provider.processRefund(refundReq);
      expect(res1.status).toBe('SUCCESS');
      expect(res1.refundId).toBeDefined();

      const res2 = await provider.processRefund(refundReq);
      expect(res2.refundId).toBe(res1.refundId);
      expect(res2.idempotencyKey).toBe('idemp_refund_test_001');
    });
  });

  describe('KYC Providers (MockKycProvider & SurepassKycProvider)', () => {
    let mockKyc: MockKycProvider;
    let surepassKyc: SurepassKycProvider;

    beforeEach(() => {
      mockKyc = new MockKycProvider();
      surepassKyc = new SurepassKycProvider(new ConfigService({}));
    });

    it('should verify valid 12-digit Aadhaar, mask first 8 digits, and check adult age', async () => {
      const result = await mockKyc.verifyAadhaar({ aadhaarNumber: '123456789012' });
      expect(result.verified).toBe(true);
      expect(result.maskedAadhaar).toBe('XXXXXXXX9012');
      expect(result.isAdult).toBe(true);
    });

    it('should reject invalid length Aadhaar numbers and minors', async () => {
      await expect(mockKyc.verifyAadhaar({ aadhaarNumber: '123' })).rejects.toThrow(
        BadRequestException,
      );

      const minorResult = await mockKyc.verifyAadhaar({ aadhaarNumber: '123456789999' });
      expect(minorResult.verified).toBe(false);
      expect(minorResult.isAdult).toBe(false);
      expect(minorResult.rejectionReason).toContain('minimum age requirement');
    });

    it('should verify commercial Driving License and reject expired/non-commercial licenses', async () => {
      const valid = await mockKyc.verifyDrivingLicense({
        dlNumber: 'AP3920200001234',
        dateOfBirth: '1990-05-10',
      });
      expect(valid.verified).toBe(true);
      expect(valid.isCommercialPermitted).toBe(true);

      const nonCommercial = await mockKyc.verifyDrivingLicense({
        dlNumber: 'AP39NONCOMM001',
        dateOfBirth: '1990-05-10',
      });
      expect(nonCommercial.verified).toBe(false);
      expect(nonCommercial.isCommercialPermitted).toBe(false);

      const expired = await mockKyc.verifyDrivingLicense({
        dlNumber: 'AP39EXP00001',
        dateOfBirth: '1990-05-10',
      });
      expect(expired.verified).toBe(false);
      expect(expired.isExpired).toBe(true);
    });

    it('should strictly reject non-electric vehicles in RC verification', async () => {
      const petrolRc = await mockKyc.verifyRc({ registrationNumber: 'AP-16-PETROL-101' });
      expect(petrolRc.verified).toBe(false);
      expect(petrolRc.isElectric).toBe(false);
      expect(petrolRc.fuelType).toBe('PETROL');
      expect(petrolRc.rejectionReason).toContain('strictly prohibits ICE/Hybrid propulsion');

      const dieselRc = await mockKyc.verifyRc({ registrationNumber: 'AP-16-DIESEL-202' });
      expect(dieselRc.verified).toBe(false);
      expect(dieselRc.isElectric).toBe(false);

      const evRc = await mockKyc.verifyRc({ registrationNumber: 'AP-16-EV-303' });
      expect(evRc.verified).toBe(true);
      expect(evRc.isElectric).toBe(true);
      expect(evRc.fuelType).toBe('ELECTRIC');
    });

    it('should fail closed in SurepassKycProvider when API token is absent and route to manual review', async () => {
      const aadhaarRes = await surepassKyc.verifyAadhaar({ aadhaarNumber: '987654321012' });
      expect(aadhaarRes.verified).toBe(false);
      expect(aadhaarRes.rejectionReason).toContain('manual verification queue');

      const dlRes = await surepassKyc.verifyDrivingLicense({
        dlNumber: 'AP3120220004567',
        dateOfBirth: '1995-01-01',
      });
      expect(dlRes.verified).toBe(false);
      expect(dlRes.rejectionReason).toContain('manual review queue');
    });
  });

  describe('MockWhatsAppProvider', () => {
    let whatsapp: MockWhatsAppProvider;

    beforeEach(() => {
      whatsapp = new MockWhatsAppProvider();
    });

    it('should dispatch registered business template in Telugu, English, Hindi', async () => {
      const resultTe = await whatsapp.sendTemplateMessage({
        toPhone: '+919123400001',
        templateName: 'ecoride_ride_confirmed',
        languageCode: 'te',
        templateParameters: { captain_name: 'Srinivas', vehicle: 'AP-31-EV-0001' },
      });

      expect(resultTe.status).toBe('SENT');
      expect(resultTe.messageId).toBeDefined();

      const resultEn = await whatsapp.sendTemplateMessage({
        toPhone: '+919123400002',
        templateName: 'ecoride_sos_alert',
        languageCode: 'en',
        templateParameters: { rider_name: 'Kavya' },
      });

      expect(resultEn.status).toBe('SENT');
      expect(whatsapp.getSentMessagesForTesting().length).toBe(2);
    });

    it('should reject invalid phone format, unregistered template, or unsupported language', async () => {
      await expect(
        whatsapp.sendTemplateMessage({
          toPhone: '12345',
          templateName: 'ecoride_ride_confirmed',
          languageCode: 'te',
          templateParameters: {},
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        whatsapp.sendTemplateMessage({
          toPhone: '+919123400001',
          templateName: 'unregistered_spam_template',
          languageCode: 'te',
          templateParameters: {},
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        whatsapp.sendTemplateMessage({
          toPhone: '+919123400001',
          templateName: 'ecoride_ride_confirmed',
          languageCode: 'fr' as unknown as 'te',
          templateParameters: {},
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GoogleMapsProvider with Spatial Caching & Fallback', () => {
    let googleMaps: GoogleMapsProvider;
    let mockMaps: MockMapsProvider;

    beforeEach(() => {
      mockMaps = new MockMapsProvider();
      googleMaps = new GoogleMapsProvider(
        new ConfigService({ GOOGLE_MAPS_API_KEY: '' }),
        mockMaps,
      );
    });

    it('should calculate distance matrix via fallback and cache subsequent calls', async () => {
      const origin = { latitude: 16.4975, longitude: 80.6558 }; // Benz Circle, Vijayawada
      const destination = { latitude: 16.5085, longitude: 80.6178 }; // PNBS, Vijayawada

      const res1 = await googleMaps.calculateDistanceMatrix(origin, destination);
      expect(res1.distanceMeters).toBeGreaterThan(3000);
      expect(res1.durationSeconds).toBeGreaterThan(100);

      // Subsequent call with same coordinates should resolve quickly from cache
      const res2 = await googleMaps.calculateDistanceMatrix(origin, destination);
      expect(res2.distanceMeters).toBe(res1.distanceMeters);
      expect(res2.durationSeconds).toBe(res1.durationSeconds);
    });

    it('should reverse geocode Vijayawada/Guntur landmarks accurately', async () => {
      const benzCircle = { latitude: 16.4975, longitude: 80.6558 };
      const address = await googleMaps.reverseGeocode(benzCircle);
      expect(address).toContain('Benz Circle, Vijayawada');
    });
  });
});
