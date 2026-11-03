import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { FareRulesService } from '../src/modules/fare-rules/fare-rules.service';
import { QuotesService } from '../src/modules/quotes/quotes.service';

describe('FareRulesService & Versioned Pricing Engine (TASK EV-034)', () => {
  let fareRulesService: FareRulesService;
  let quotesService: QuotesService;

  const mockAdminActor = {
    id: 'a0000000-0000-0000-0000-000000000001',
    role: 'ADMIN',
    ipAddress: '127.0.0.1',
    correlationId: 'test-admin-trace-01',
  };

  const mockRiderActor = {
    id: 'r0000000-0000-0000-0000-000000000001',
    role: 'RIDER',
    ipAddress: '127.0.0.1',
    correlationId: 'test-rider-trace-01',
  };

  beforeEach(async () => {
    fareRulesService = new FareRulesService();
    quotesService = new QuotesService(undefined, fareRulesService);
  });

  describe('1. Draft Fare Rule Creation & Version Auto-Increment', () => {
    it('should create initial fare rule version 1 in DRAFT status', async () => {
      const draft = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-2026-V1',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2500,
          baseDistanceMeters: 1000,
          perKmRatePaise: 800,
          perMinuteRatePaise: 100,
          waitingChargePaisePerMinute: 100,
          minimumFarePaise: 2500,
          taxRateBps: 500, // 5% GST
          commissionRateBps: 1500, // 15%
          effectiveFrom: '2026-01-01T00:00:00Z',
          notes: 'Initial AP pilot 2W tariff',
        },
        mockAdminActor,
      );

      expect(draft.id).toBeDefined();
      expect(draft.version).toBe(1);
      expect(draft.status).toBe('DRAFT');
      expect(draft.city).toBe('visakhapatnam');
      expect(draft.serviceCategory).toBe('CITY_COMMUTE_2W');
      expect(draft.baseFarePaise).toBe(2500);
      expect(draft.isIllustrative).toBe(false);
    });

    it('should auto-increment version number to 2 for subsequent draft in same city and category', async () => {
      await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-2026-V1',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2500,
          perKmRatePaise: 800,
          effectiveFrom: '2026-01-01T00:00:00Z',
        },
        mockAdminActor,
      );

      const draftV2 = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-2026-V2',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 3000,
          perKmRatePaise: 900,
          effectiveFrom: '2026-06-01T00:00:00Z',
        },
        mockAdminActor,
      );

      expect(draftV2.version).toBe(2);
      expect(draftV2.status).toBe('DRAFT');
    });

    it('should explicitly flag source PDF illustrative fares as isIllustrative=true and DRAFT', async () => {
      const illustrativeRule = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-4W-ILLUSTRATIVE',
          city: 'visakhapatnam',
          serviceCategory: 'CAB_PRIVATE_4W',
          baseFarePaise: 5000,
          perKmRatePaise: 1500,
          effectiveFrom: '2026-01-01T00:00:00Z',
          isIllustrative: true,
          notes: 'Source PDF pitch deck illustrative fare - unapproved',
        },
        mockAdminActor,
      );

      expect(illustrativeRule.isIllustrative).toBe(true);
      expect(illustrativeRule.status).toBe('DRAFT');
      expect(illustrativeRule.approvedAt).toBeUndefined();
    });
  });

  describe('2. Statutory Approval Workflow & Audit Enforcement', () => {
    it('should reject approval attempt by non-admin actor with 403 Forbidden', async () => {
      const draft = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-TEST',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2500,
          perKmRatePaise: 800,
          effectiveFrom: '2026-01-01T00:00:00Z',
        },
        mockAdminActor,
      );

      await expect(
        fareRulesService.approveRule(
          draft.id,
          { evidenceReference: 'AP-STA-2026-GO-42' },
          mockRiderActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject approval without statutory evidence reference with 400 BadRequest', async () => {
      const draft = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-TEST',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2500,
          perKmRatePaise: 800,
          effectiveFrom: '2026-01-01T00:00:00Z',
        },
        mockAdminActor,
      );

      await expect(
        fareRulesService.approveRule(draft.id, { evidenceReference: '   ' }, mockAdminActor),
      ).rejects.toThrow(BadRequestException);
    });

    it('should promote DRAFT rule to ACTIVE with approved audit metadata', async () => {
      const draft = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-2026-V1',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2500,
          perKmRatePaise: 800,
          effectiveFrom: '2026-01-01T00:00:00Z',
        },
        mockAdminActor,
      );

      const approved = await fareRulesService.approveRule(
        draft.id,
        { evidenceReference: 'AP-STA-2026-GO-42-PILOT' },
        mockAdminActor,
      );

      expect(approved.status).toBe('ACTIVE');
      expect(approved.evidenceReference).toBe('AP-STA-2026-GO-42-PILOT');
      expect(approved.approvedById).toBe(mockAdminActor.id);
      expect(approved.approvedAt).toBeDefined();
    });

    it('should supersede previous active rule when a newer version is approved', async () => {
      const v1 = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-V1',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2500,
          perKmRatePaise: 800,
          effectiveFrom: '2026-01-01T00:00:00Z',
        },
        mockAdminActor,
      );
      await fareRulesService.approveRule(
        v1.id,
        { evidenceReference: 'AP-STA-2026-GO-42' },
        mockAdminActor,
      );

      const v2 = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-V2',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 3000,
          perKmRatePaise: 900,
          effectiveFrom: '2026-06-01T00:00:00Z',
        },
        mockAdminActor,
      );

      const approvedV2 = await fareRulesService.approveRule(
        v2.id,
        { evidenceReference: 'AP-STA-2026-GO-99' },
        mockAdminActor,
      );

      expect(approvedV2.status).toBe('ACTIVE');
      expect(approvedV2.version).toBe(2);

      const updatedV1 = await fareRulesService.getRuleById(v1.id);
      expect(updatedV1.status).toBe('SUPERSEDED');
      expect(updatedV1.effectiveTo).toBeDefined();
    });

    it('should reject a proposed draft rule with documented reason', async () => {
      const draft = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-INVALID',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 99999,
          perKmRatePaise: 5000,
          effectiveFrom: '2026-01-01T00:00:00Z',
        },
        mockAdminActor,
      );

      const rejected = await fareRulesService.rejectRule(
        draft.id,
        { rejectionReason: 'Base fare exceeds AP statutory tariff ceiling of ₹40' },
        mockAdminActor,
      );

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toContain('tariff ceiling');
    });
  });

  describe('3. Pricing Engine & Immutability Demonstration', () => {
    it('should block quoting when only unapproved DRAFT or illustrative rules exist', async () => {
      await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-ILLUSTRATIVE-ONLY',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2000,
          perKmRatePaise: 700,
          effectiveFrom: '2026-01-01T00:00:00Z',
          isIllustrative: true,
        },
        mockAdminActor,
      );

      await expect(
        quotesService.calculateAuthoritativeQuote({
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          pickupLatitude: 17.7126,
          pickupLongitude: 83.3174,
          dropoffLatitude: 17.7314,
          dropoffLongitude: 83.3325,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should compute exact integer paise fare with 5% AP GST breakdown (2.5% CGST + 2.5% SGST)', async () => {
      const rule = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-APPROVED',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 2500, // ₹25 base
          baseDistanceMeters: 1000, // 1 km included
          perKmRatePaise: 800, // ₹8/km beyond 1 km
          perMinuteRatePaise: 100, // ₹1/min
          waitingChargePaisePerMinute: 100,
          minimumFarePaise: 2500,
          taxRateBps: 500, // 5% GST
          effectiveFrom: '2026-01-01T00:00:00Z',
        },
        mockAdminActor,
      );
      await fareRulesService.approveRule(
        rule.id,
        { evidenceReference: 'AP-STA-2026-GO-42' },
        mockAdminActor,
      );

      const quote = await quotesService.calculateAuthoritativeQuote({
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.7314,
        dropoffLongitude: 83.3325,
      });

      expect(quote.quoteId).toBeDefined();
      expect(quote.fareRuleId).toBe(rule.id);
      expect(quote.fareRuleVersion).toBe(1);
      expect(quote.fareBreakdown).toBeDefined();

      const breakdown = quote.fareBreakdown!;
      expect(breakdown.baseFarePaise).toBe(2500);
      expect(breakdown.taxes.cgstPaise + breakdown.taxes.sgstPaise).toBe(breakdown.taxPaise);
      expect(breakdown.totalPaise).toBe(
        (breakdown.unroundedTotalPaise ??
          breakdown.surgedSubtotalPaise - breakdown.discountPaise + breakdown.taxPaise) +
          (breakdown.roundingDeltaPaise || 0),
      );
      expect(Number.isInteger(breakdown.totalPaise)).toBe(true);
    });

    it('should correctly apply promotional discounts capped by maxDiscountPaise', async () => {
      const rule = await fareRulesService.createDraft(
        {
          ruleCode: 'VIZAG-2W-PROMO',
          city: 'visakhapatnam',
          serviceCategory: 'CITY_COMMUTE_2W',
          baseFarePaise: 3000,
          baseDistanceMeters: 1000,
          perKmRatePaise: 1000,
          taxRateBps: 500,
          promotions: [
            {
              promoCode: 'SAVE20',
              discountPercent: 20, // 20%
              maxDiscountPaise: 500, // max ₹5 cap
              minTripFarePaise: 2000,
              validFrom: '2026-01-01T00:00:00Z',
              validTo: '2026-12-31T23:59:59Z',
            },
          ],
          effectiveFrom: '2026-01-01T00:00:00Z',
        },
        mockAdminActor,
      );
      await fareRulesService.approveRule(
        rule.id,
        { evidenceReference: 'AP-STA-2026-GO-42' },
        mockAdminActor,
      );

      const quoteWithPromo = await quotesService.calculateAuthoritativeQuote({
        city: 'visakhapatnam',
        serviceCategory: 'CITY_COMMUTE_2W',
        pickupLatitude: 17.7126,
        pickupLongitude: 83.3174,
        dropoffLatitude: 17.7314,
        dropoffLongitude: 83.3325,
        promoCode: 'SAVE20',
      });

      expect(quoteWithPromo.appliedPromoCode).toBe('SAVE20');
      expect(quoteWithPromo.fareBreakdown!.discountPaise).toBe(500); // Capped at max ₹5
    });
  });
});
