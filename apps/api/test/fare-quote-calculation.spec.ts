import { BadRequestException } from '@nestjs/common';
import { ApiErrorCode, VehicleCategory, VehicleServiceClass } from '@ecoride/contracts';
import { QuotesService } from '../src/modules/quotes/quotes.service';
import { FareRule } from '../src/database/entities/fare-rule.entity';

describe('Fare Quote Calculation & Rounding (EV-035 Unit Specs)', () => {
  let quotesService: QuotesService;

  // Mock approved active fare rule for Visakhapatnam CITY_COMMUTE_2W
  const mock2WRule: FareRule = {
    id: 'f0000000-0000-0000-0000-000000000002',
    ruleCode: 'VIZAG-2W-PILOT-V1',
    version: 1,
    city: 'visakhapatnam',
    serviceCategory: 'CITY_COMMUTE_2W',
    status: 'ACTIVE',
    baseFarePaise: 2500, // ₹25.00
    baseDistanceMeters: 1000, // 1.0 km
    perKmRatePaise: 800, // ₹8.00 / km
    perMinuteRatePaise: 100, // ₹1.00 / min
    waitingChargePaisePerMinute: 100, // ₹1.00 / min
    minimumFarePaise: 2500, // ₹25.00
    surgeMultiplier: 1.0,
    taxRateBps: 500, // 5% AP GST
    commissionRateBps: 1500,
    promotions: [
      {
        promoCode: 'ECOPILOT',
        discountPercent: 10,
        maxDiscountPaise: 2000,
        minTripFarePaise: 3000,
        validFrom: '2026-01-01T00:00:00Z',
        validTo: '2026-12-31T23:59:59Z',
      },
    ],
    effectiveFrom: new Date('2026-01-01T00:00:00Z'),
    effectiveTo: null,
    isIllustrative: false,
    evidenceReference: 'AP-STA-2026-GO-42-PILOT-CORRIDOR',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FareRule;

  // Mock approved active fare rule for Visakhapatnam SHARED_SHUTTLE_4W
  const mockShuttleRule: FareRule = {
    id: 'f0000000-0000-0000-0000-000000000003',
    ruleCode: 'VIZAG-SHUTTLE-PILOT-V1',
    version: 1,
    city: 'visakhapatnam',
    serviceCategory: 'SHARED_SHUTTLE_4W',
    status: 'ACTIVE',
    baseFarePaise: 3500, // ₹35.00
    baseDistanceMeters: 2000, // 2.0 km
    perKmRatePaise: 600, // ₹6.00 / km
    perMinuteRatePaise: 50, // ₹0.50 / min
    waitingChargePaisePerMinute: 50,
    minimumFarePaise: 3500,
    surgeMultiplier: 1.0,
    taxRateBps: 500, // 5% AP GST
    commissionRateBps: 1500,
    promotions: null,
    effectiveFrom: new Date('2026-01-01T00:00:00Z'),
    effectiveTo: null,
    isIllustrative: false,
    evidenceReference: 'AP-STA-2026-GO-43-SHUTTLE',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as FareRule;

  beforeEach(() => {
    quotesService = new QuotesService();
  });

  describe('1. Deterministic Known Calculation Examples', () => {
    it('should calculate 5 km 2W electric bike ride deterministically to exact paise', () => {
      // 5 km trip, 15 min duration:
      // Base: 2500 paise (1 km)
      // Distance beyond base: 4 km * 800 = 3200 paise
      // Time fare: 15 min * 100 = 1500 paise
      // Unit subtotal: 2500 + 3200 + 1500 = 7200 paise
      // Platform fee: 200 paise
      // Net taxable: 7400 paise
      // Tax: 5% of 7400 = 370 paise (CGST 185, SGST 185)
      // Unrounded total: 7770 paise
      // Nearest whole rupee rounding: 7800 paise (₹78.00)
      // Rounding delta: +30 paise
      const quote = quotesService.calculateQuote(
        {
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          passengerCount: 1,
        },
        mock2WRule,
        {
          distanceMeters: 5000,
          durationMinutes: 15,
          isFallback: false,
        },
      );

      expect(quote.fare.amountPaise).toBe(7800);
      expect(quote.fare.formattedRupees).toBe('₹78.00');
      expect(quote.fareBreakdown).toBeDefined();

      const bd = quote.fareBreakdown!;
      expect(bd.baseFarePaise).toBe(2500);
      expect(bd.distanceFarePaise).toBe(3200);
      expect(bd.timeFarePaise).toBe(1500);
      expect(bd.subtotalPaise).toBe(7200);
      expect(bd.platformFeePaise).toBe(200);
      expect(bd.taxes.cgstPaise).toBe(185);
      expect(bd.taxes.sgstPaise).toBe(185);
      expect(bd.taxes.totalTaxPaise).toBe(370);
      expect(bd.unroundedTotalPaise).toBe(7770);
      expect(bd.roundingDeltaPaise).toBe(30);
      expect(bd.totalPaise).toBe(7800);
      expect(bd.isRouteFallback).toBe(false);
      expect(quote.passengerCount).toBe(1);
      expect(quote.vehicleClass).toBe(VehicleServiceClass.ECO_BIKE);
    });

    it('should calculate shared shuttle fare per seat scaled by passenger count', () => {
      // 12 km trip, 30 min duration, 3 passengers:
      // Base: 3500 paise (2 km)
      // Distance beyond base: 10 km * 600 = 6000 paise
      // Time fare: 30 min * 50 = 1500 paise
      // Unit seat fare: 3500 + 6000 + 1500 = 11000 paise (₹110.00 / passenger)
      // Subtotal (3 passengers): 11000 * 3 = 33000 paise
      // Platform fee: 200 paise
      // Net taxable: 33200 paise
      // Tax: 5% of 33200 = 1660 paise (CGST 830, SGST 830)
      // Unrounded total: 34860 paise
      // Nearest whole rupee rounding: 34900 paise (₹349.00)
      // Rounding delta: +40 paise
      const quote = quotesService.calculateQuote(
        {
          city: 'visakhapatnam',
          serviceCategory: 'SHARED_SHUTTLE_4W',
          pickupLatitude: 17.6868,
          pickupLongitude: 83.2185,
          dropoffLatitude: 17.78,
          dropoffLongitude: 83.38,
          passengerCount: 3,
        },
        mockShuttleRule,
        {
          distanceMeters: 12000,
          durationMinutes: 30,
          isFallback: false,
        },
      );

      expect(quote.fare.amountPaise).toBe(34900);
      expect(quote.fare.formattedRupees).toBe('₹349.00');

      const bd = quote.fareBreakdown!;
      expect(bd.perPassengerFarePaise).toBe(11000);
      expect(bd.subtotalPaise).toBe(33000);
      expect(bd.platformFeePaise).toBe(200);
      expect(bd.taxes.cgstPaise).toBe(830);
      expect(bd.taxes.sgstPaise).toBe(830);
      expect(bd.taxes.totalTaxPaise).toBe(1660);
      expect(bd.unroundedTotalPaise).toBe(34860);
      expect(bd.roundingDeltaPaise).toBe(40);
      expect(bd.totalPaise).toBe(34900);
      expect(bd.passengerCount).toBe(3);
      expect(quote.vehicleClass).toBe(VehicleServiceClass.ECO_VAN);
    });
  });

  describe('2. Whole-Rupee Rounding Scenarios', () => {
    it('should accurately compute negative rounding delta when rounding down', () => {
      // Create conditions where unrounded total ends in .35 or .40
      // 1000m (0 km beyond base), 0 duration:
      // Base: 2500 paise
      // Platform fee: 200 paise
      // Net taxable: 2700 paise
      // Tax 5% of 2700 = 135 paise
      // Unrounded: 2835 paise (₹28.35)
      // Rounded to nearest whole rupee: 2800 paise (₹28.00)
      // Delta: 2800 - 2835 = -35 paise
      const quote = quotesService.calculateQuote(
        {
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.715,
          dropoffLongitude: 83.32,
          passengerCount: 1,
        },
        mock2WRule,
        {
          distanceMeters: 1000,
          durationMinutes: 0,
          isFallback: false,
        },
      );

      const bd = quote.fareBreakdown!;
      expect(bd.unroundedTotalPaise).toBe(2835);
      expect(bd.totalPaise).toBe(2800);
      expect(bd.roundingDeltaPaise).toBe(-35);
      expect(quote.fare.formattedRupees).toBe('₹28.00');
    });

    it('should report zero rounding delta when unrounded total is exact whole rupee', () => {
      // Custom rule with 0% tax to produce exact round figure
      const zeroTaxRule: FareRule = {
        ...mock2WRule,
        taxRateBps: 0,
        baseFarePaise: 2800, // ₹28.00
      } as FareRule;

      // 1000m, 0 min:
      // Base: 2800 paise
      // Platform fee: 200 paise
      // Net taxable: 3000 paise
      // Tax: 0
      // Unrounded: 3000 paise (₹30.00)
      // Rounded: 3000 paise (₹30.00)
      // Delta: 0 paise
      const quote = quotesService.calculateQuote(
        {
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.715,
          dropoffLongitude: 83.32,
        },
        zeroTaxRule,
        {
          distanceMeters: 1000,
          durationMinutes: 0,
          isFallback: false,
        },
      );

      const bd = quote.fareBreakdown!;
      expect(bd.unroundedTotalPaise).toBe(3000);
      expect(bd.totalPaise).toBe(3000);
      expect(bd.roundingDeltaPaise).toBe(0);
    });
  });

  describe('3. Vehicle Class & Category Matching', () => {
    it('should accept matching vehicleClass ECO_BIKE and serviceCategory CITY_COMMUTE_2W', () => {
      const res = quotesService.validateAndResolveVehicleAndCategory({
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        vehicleClass: 'ECO_BIKE',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.7314,
        dropoffLongitude: 83.3325,
      });

      expect(res.serviceCategory).toBe('CITY_COMMUTE_2W');
      expect(res.vehicleClass).toBe(VehicleServiceClass.ECO_BIKE);
      expect(res.passengerCount).toBe(1);
    });

    it('should reject incompatible vehicleClass ECO_CAB with serviceCategory CITY_COMMUTE_2W', () => {
      try {
        quotesService.validateAndResolveVehicleAndCategory({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          vehicleClass: 'ECO_CAB',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        });
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.BAD_REQUEST);
        expect(res.message).toContain('incompatible');
      }
    });

    it('should derive serviceCategory when only vehicleClass ECO_BIKE is provided', () => {
      const res = quotesService.validateAndResolveVehicleAndCategory({
        city: 'visakhapatnam',
        serviceCategory: '',
        vehicleClass: 'ECO_BIKE',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.7314,
        dropoffLongitude: 83.3325,
      });

      expect(res.serviceCategory).toBe(VehicleCategory.CITY_COMMUTE_2W);
      expect(res.vehicleClass).toBe(VehicleServiceClass.ECO_BIKE);
    });
  });

  describe('4. Legal Passenger Capacity Enforcement', () => {
    it('should allow 1 passenger for CITY_COMMUTE_2W (D+1)', () => {
      const res = quotesService.validateAndResolveVehicleAndCategory({
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        passengerCount: 1,
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.7314,
        dropoffLongitude: 83.3325,
      });

      expect(res.passengerCount).toBe(1);
    });

    it('should reject passenger count > 1 for 2W electric bike taxi (D+1)', () => {
      try {
        quotesService.validateAndResolveVehicleAndCategory({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          passengerCount: 2, // Over-capacity for 2W
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        });
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.BAD_REQUEST);
        expect(res.message).toContain('exceeds legal passenger capacity of 1');
      }
    });

    it('should reject passenger count exceeding legal 10 seats for SHARED_SHUTTLE_4W (D+10)', () => {
      try {
        quotesService.validateAndResolveVehicleAndCategory({
          city: 'visakhapatnam',
          serviceCategory: 'SHARED_SHUTTLE_4W',
          passengerCount: 11, // Over legal limit
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        });
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.BAD_REQUEST);
        expect(res.message).toContain('exceeds legal passenger capacity of 10');
      }
    });

    it('should reject passenger count of 0', () => {
      try {
        quotesService.validateAndResolveVehicleAndCategory({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          passengerCount: 0,
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        });
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as { code: string; message: string };
        expect(res.code).toBe(ApiErrorCode.BAD_REQUEST);
      }
    });
  });

  describe('5. Client Tamper-Resistance', () => {
    it('should strictly ignore clientSuppliedFare and use authoritative calculated fare', () => {
      const quote = quotesService.calculateQuote(
        {
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
          clientSuppliedFare: 100, // Attacker attempts to pay ₹1.00 instead of ₹78.00
          passengerCount: 1,
        },
        mock2WRule,
        {
          distanceMeters: 5000,
          durationMinutes: 15,
          isFallback: false,
        },
      );

      // Server computation must completely ignore clientSuppliedFare: 100
      expect(quote.fare.amountPaise).toBe(7800);
      expect(quote.fare.amountPaise).not.toBe(100);
    });
  });

  describe('6. Provider Fallback Routing Flagging', () => {
    it('should flag isRouteFallback: true when routeEstimate indicates provider fallback', () => {
      const quote = quotesService.calculateQuote(
        {
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.745,
          dropoffLongitude: 83.342,
        },
        mock2WRule,
        {
          distanceMeters: 5000,
          durationMinutes: 15,
          isFallback: true, // Degraded upstream maps provider
        },
      );

      expect(quote.fareBreakdown?.isRouteFallback).toBe(true);
      expect(quote.fare.amountPaise).toBe(7800);
    });

    it('should compute valid fallback distance via spherical formula when no route estimate is supplied', () => {
      const quote = quotesService.calculateQuote(
        {
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.6868,
          pickupLongitude: 83.2185,
          dropoffLatitude: 17.7275,
          dropoffLongitude: 83.3038,
        },
        mock2WRule,
      );

      expect(quote.fareBreakdown?.isRouteFallback).toBe(true);
      expect(quote.distanceMeters).toBeGreaterThan(9500);
      expect(quote.fare.amountPaise).toBeGreaterThan(mock2WRule.baseFarePaise);
    });
  });
});
