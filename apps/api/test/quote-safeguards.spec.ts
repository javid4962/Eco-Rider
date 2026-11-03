import { BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { ApiErrorCode, VehicleServiceClass } from '@ecoride/contracts';
import { QuotesService } from '../src/modules/quotes/quotes.service';
import { ZonesService } from '../src/modules/zones/zones.service';
import { FareRule } from '../src/database/entities/fare-rule.entity';
import { RideQuote } from '../src/database/entities/ride-quote.entity';
import { Repository } from 'typeorm';

describe('Quote Safeguards, Expiry, Eligibility & Replay (EV-036 Unit Specs)', () => {
  let quotesService: QuotesService;
  let mockQuoteRepo: Partial<Repository<RideQuote>>;
  let mockZonesService: { verifyLocation: jest.Mock };
  let savedEntities: RideQuote[] = [];

  const mockFareRule: FareRule = {
    id: 'f0000000-0000-0000-0000-000000000002',
    ruleCode: 'VIZAG-2W-PILOT-V1',
    version: 1,
    city: 'visakhapatnam',
    serviceCategory: 'CITY_COMMUTE_2W',
    status: 'ACTIVE',
    baseFarePaise: 2500,
    baseDistanceMeters: 1000,
    perKmRatePaise: 800,
    perMinuteRatePaise: 100,
    waitingChargePaisePerMinute: 100,
    minimumFarePaise: 2500,
    surgeMultiplier: 1.0,
    taxRateBps: 500,
    commissionRateBps: 1500,
    promotions: null,
    effectiveFrom: new Date('2026-01-01T00:00:00Z'),
    effectiveTo: null,
    isIllustrative: false,
    evidenceReference: 'AP-STA-2026-GO-42-PILOT-CORRIDOR',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FareRule;

  beforeEach(() => {
    savedEntities = [];
    mockQuoteRepo = {
      findOne: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        const found = savedEntities.find((e) => e.id === where.id);
        return Promise.resolve(found || null);
      }),
      save: jest.fn().mockImplementation((entity: RideQuote) => {
        const idx = savedEntities.findIndex((e) => e.id === entity.id);
        if (idx >= 0) {
          savedEntities[idx] = entity;
        } else {
          savedEntities.push(entity);
        }
        return Promise.resolve(entity);
      }),
    };

    mockZonesService = {
      verifyLocation: jest.fn().mockResolvedValue({
        isAuthorized: true,
        zoneName: 'Visakhapatnam Pilot Corridor',
      }),
    };

    quotesService = new QuotesService(
      mockZonesService as unknown as ZonesService,
      undefined,
      mockQuoteRepo as Repository<RideQuote>,
      undefined,
    );
  });

  describe('1. Cryptographic HMAC Quote Token Generation & Verification', () => {
    it('should generate a valid HMAC quote token and successfully verify it', () => {
      const payload = {
        quoteId: 'q0000000-0000-4000-8000-000000000001',
        riderId: 'r0000000-0000-4000-8000-000000000001',
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        vehicleClass: VehicleServiceClass.ECO_BIKE,
        passengerCount: 1,
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.745,
        dropoffLongitude: 83.342,
        fareRuleId: mockFareRule.id,
        fareRuleVersion: mockFareRule.version,
        totalFarePaise: 7800,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      };

      const token = quotesService.generateQuoteToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(2);

      const verification = quotesService.verifyQuoteToken(token);
      expect(verification.isValid).toBe(true);
      expect(verification.payload?.quoteId).toBe(payload.quoteId);
      expect(verification.payload?.totalFarePaise).toBe(7800);
      expect(verification.payload?.fareRuleVersion).toBe(1);
    });

    it('should reject tampered token signatures with TAMPERED_SIGNATURE', () => {
      const payload = {
        quoteId: 'q0000000-0000-4000-8000-000000000001',
        riderId: 'r0000000-0000-4000-8000-000000000001',
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        vehicleClass: VehicleServiceClass.ECO_BIKE,
        passengerCount: 1,
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.745,
        dropoffLongitude: 83.342,
        fareRuleId: mockFareRule.id,
        fareRuleVersion: mockFareRule.version,
        totalFarePaise: 7800,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      };

      const token = quotesService.generateQuoteToken(payload);
      const [payloadB64, signature] = token.split('.');
      // Tamper signature by replacing characters
      const tamperedSig = signature.substring(0, signature.length - 4) + 'XXXX';
      const tamperedToken = `${payloadB64}.${tamperedSig}`;

      const res = quotesService.verifyQuoteToken(tamperedToken);
      expect(res.isValid).toBe(false);
      expect(res.reason).toBe('TAMPERED_SIGNATURE');
    });

    it('should reject tampered payload data where client modified fare', () => {
      const payload = {
        quoteId: 'q0000000-0000-4000-8000-000000000001',
        riderId: 'r0000000-0000-4000-8000-000000000001',
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        vehicleClass: VehicleServiceClass.ECO_BIKE,
        passengerCount: 1,
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.745,
        dropoffLongitude: 83.342,
        fareRuleId: mockFareRule.id,
        fareRuleVersion: mockFareRule.version,
        totalFarePaise: 7800,
        expiresAt: new Date(Date.now() + 600000).toISOString(),
      };

      const token = quotesService.generateQuoteToken(payload);
      const [, signature] = token.split('.');

      // Attacker attempts to modify payload to 100 paise
      const alteredPayload = { ...payload, totalFarePaise: 100 };
      const alteredB64 = Buffer.from(JSON.stringify(alteredPayload)).toString('base64url');
      const forgedToken = `${alteredB64}.${signature}`;

      const res = quotesService.verifyQuoteToken(forgedToken);
      expect(res.isValid).toBe(false);
      expect(res.reason).toBe('TAMPERED_SIGNATURE');
    });
  });

  describe('2. Quote Expiry Safeguards', () => {
    it('should detect token expiration and return EXPIRED reason', () => {
      const expiredPayload = {
        quoteId: 'q0000000-0000-4000-8000-000000000002',
        riderId: 'r0000000-0000-4000-8000-000000000001',
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        vehicleClass: VehicleServiceClass.ECO_BIKE,
        passengerCount: 1,
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.745,
        dropoffLongitude: 83.342,
        fareRuleId: mockFareRule.id,
        fareRuleVersion: mockFareRule.version,
        totalFarePaise: 7800,
        expiresAt: new Date(Date.now() - 1000).toISOString(), // expired 1s ago
      };

      const expiredToken = quotesService.generateQuoteToken(expiredPayload);
      const res = quotesService.verifyQuoteToken(expiredToken);
      expect(res.isValid).toBe(false);
      expect(res.reason).toBe('EXPIRED');
    });

    it('should reject expired quote in verifyQuoteEligibility and mark entity as EXPIRED', async () => {
      const quote = new RideQuote();
      quote.id = 'q0000000-0000-4000-8000-000000000003';
      quote.riderId = 'r0000000-0000-4000-8000-000000000001';
      quote.city = 'visakhapatnam';
      quote.serviceCategory = 'CITY_COMMUTE_2W';
      quote.vehicleClass = VehicleServiceClass.ECO_BIKE;
      quote.passengerCount = 1;
      quote.pickupLatitude = 17.7126;
      quote.pickupLongitude = 83.3174;
      quote.dropoffLatitude = 17.745;
      quote.dropoffLongitude = 83.342;
      quote.fareRuleId = mockFareRule.id;
      quote.fareRuleVersion = 1;
      quote.totalFarePaise = 7800;
      quote.status = 'ACTIVE';
      quote.expiresAt = new Date(Date.now() - 5000); // 5s in past
      savedEntities.push(quote);

      try {
        await quotesService.verifyQuoteEligibility(quote.id, quote.riderId);
        fail('Expected BadRequestException for expired quote');
      } catch (err: unknown) {
        const error = err as BadRequestException;
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error.getResponse() as { code: string })?.code).toBe(ApiErrorCode.BAD_REQUEST);
      }

      const updated = savedEntities.find((e) => e.id === quote.id);
      expect(updated?.status).toBe('EXPIRED');
    });
  });

  describe('3. Cross-Account Access Safeguards', () => {
    it('should reject cross-account quote access with HTTP 403 Forbidden', async () => {
      const quote = new RideQuote();
      quote.id = 'q0000000-0000-4000-8000-000000000004';
      quote.riderId = 'r0000000-0000-4000-8000-000000000001'; // Rider Alice
      quote.city = 'visakhapatnam';
      quote.serviceCategory = 'CITY_COMMUTE_2W';
      quote.vehicleClass = VehicleServiceClass.ECO_BIKE;
      quote.passengerCount = 1;
      quote.pickupLatitude = 17.7126;
      quote.pickupLongitude = 83.3174;
      quote.dropoffLatitude = 17.745;
      quote.dropoffLongitude = 83.342;
      quote.fareRuleId = mockFareRule.id;
      quote.fareRuleVersion = 1;
      quote.totalFarePaise = 7800;
      quote.status = 'ACTIVE';
      quote.expiresAt = new Date(Date.now() + 600000);
      savedEntities.push(quote);

      // Rider Bob attempts to verify Alice's quote
      const bobUserId = 'r0000000-0000-4000-8000-000000000002';
      try {
        await quotesService.verifyQuoteEligibility(quote.id, bobUserId);
        fail('Expected ForbiddenException for cross-account quote');
      } catch (err: unknown) {
        const error = err as ForbiddenException;
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error.getResponse() as { code: string })?.code).toBe(ApiErrorCode.FORBIDDEN);
      }
    });
  });

  describe('4. Lifecycle Status & Consumed Safeguards', () => {
    it('should reject already consumed quote with HTTP 409 Conflict', async () => {
      const quote = new RideQuote();
      quote.id = 'q0000000-0000-4000-8000-000000000005';
      quote.riderId = 'r0000000-0000-4000-8000-000000000001';
      quote.city = 'visakhapatnam';
      quote.serviceCategory = 'CITY_COMMUTE_2W';
      quote.vehicleClass = VehicleServiceClass.ECO_BIKE;
      quote.passengerCount = 1;
      quote.pickupLatitude = 17.7126;
      quote.pickupLongitude = 83.3174;
      quote.dropoffLatitude = 17.745;
      quote.dropoffLongitude = 83.342;
      quote.fareRuleId = mockFareRule.id;
      quote.fareRuleVersion = 1;
      quote.totalFarePaise = 7800;
      quote.status = 'CONSUMED';
      quote.bookingId = 'b0000000-0000-4000-8000-000000000001';
      quote.expiresAt = new Date(Date.now() + 600000);
      savedEntities.push(quote);

      try {
        await quotesService.verifyQuoteEligibility(quote.id, quote.riderId);
        fail('Expected ConflictException for consumed quote');
      } catch (err: unknown) {
        const error = err as ConflictException;
        expect(error).toBeInstanceOf(ConflictException);
        expect((error.getResponse() as { code: string })?.code).toBe(ApiErrorCode.CONFLICT);
      }
    });
  });

  describe('5. Post-Quote Zone Revocation Safeguards', () => {
    it('should reject quote and transition status to REVOKED when zone/category is disabled after quote creation', async () => {
      const quote = new RideQuote();
      quote.id = 'q0000000-0000-4000-8000-000000000006';
      quote.riderId = 'r0000000-0000-4000-8000-000000000001';
      quote.city = 'visakhapatnam';
      quote.serviceCategory = 'CITY_COMMUTE_2W';
      quote.vehicleClass = VehicleServiceClass.ECO_BIKE;
      quote.passengerCount = 1;
      quote.pickupLatitude = 17.7126;
      quote.pickupLongitude = 83.3174;
      quote.dropoffLatitude = 17.745;
      quote.dropoffLongitude = 83.342;
      quote.fareRuleId = mockFareRule.id;
      quote.fareRuleVersion = 1;
      quote.totalFarePaise = 7800;
      quote.status = 'ACTIVE';
      quote.expiresAt = new Date(Date.now() + 600000);
      savedEntities.push(quote);

      // Simulate interim administrative revocation of category switch in zone
      mockZonesService.verifyLocation.mockResolvedValueOnce({
        isAuthorized: false,
        rejectionReason: "Service category 'CITY_COMMUTE_2W' is disabled in zone",
      });

      try {
        await quotesService.verifyQuoteEligibility(quote.id, quote.riderId);
        fail('Expected BadRequestException for revoked zone');
      } catch (err: unknown) {
        const error = err as BadRequestException;
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error.getResponse() as { code: string })?.code).toBe(ApiErrorCode.ZONE_RESTRICTED);
      }

      const updated = savedEntities.find((e) => e.id === quote.id);
      expect(updated?.status).toBe('REVOKED');
    });
  });

  describe('6. Context Parameter Mismatch Safeguards', () => {
    it('should reject when requested passengerCount or coordinates differ from pinned quote', async () => {
      const quote = new RideQuote();
      quote.id = 'q0000000-0000-4000-8000-000000000007';
      quote.riderId = 'r0000000-0000-4000-8000-000000000001';
      quote.city = 'visakhapatnam';
      quote.serviceCategory = 'CITY_COMMUTE_2W';
      quote.vehicleClass = VehicleServiceClass.ECO_BIKE;
      quote.passengerCount = 1;
      quote.pickupLatitude = 17.7126;
      quote.pickupLongitude = 83.3174;
      quote.dropoffLatitude = 17.745;
      quote.dropoffLongitude = 83.342;
      quote.fareRuleId = mockFareRule.id;
      quote.fareRuleVersion = 1;
      quote.totalFarePaise = 7800;
      quote.status = 'ACTIVE';
      quote.expiresAt = new Date(Date.now() + 600000);
      savedEntities.push(quote);

      // Requested category differs
      await expect(
        quotesService.verifyQuoteEligibility(quote.id, quote.riderId, {
          serviceCategory: 'SHARED_SHUTTLE_4W',
        }),
      ).rejects.toThrow(BadRequestException);

      // Requested passengerCount differs
      await expect(
        quotesService.verifyQuoteEligibility(quote.id, quote.riderId, {
          passengerCount: 3,
        }),
      ).rejects.toThrow(BadRequestException);

      // Requested pickup latitude differs significantly
      await expect(
        quotesService.verifyQuoteEligibility(quote.id, quote.riderId, {
          pickupLatitude: 16.5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
