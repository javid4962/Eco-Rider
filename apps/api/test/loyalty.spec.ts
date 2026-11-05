import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { LoyaltyService } from '../src/modules/loyalty/loyalty.service';
import { LoyaltyController } from '../src/modules/loyalty/loyalty.controller';
import { PromoCode } from '../src/database/entities/promo-code.entity';
import { UserReferral } from '../src/database/entities/user-referral.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import { PromoDiscountType, PromoApplicableService } from '@ecoride/contracts';

describe('Loyalty & Communications Engine (M21)', () => {
  let service: LoyaltyService;

  const mockPromos: PromoCode[] = [];
  const mockReferrals: UserReferral[] = [];
  const mockLedgerEntries: LedgerEntry[] = [];

  const mockPromoRepo = {
    create: jest.fn((dto) => ({ id: 'promo-uuid-1', currentUsageCount: 0, ...dto })),
    save: jest.fn((entity) => {
      mockPromos.push(entity);
      return Promise.resolve(entity);
    }),
    findOne: jest.fn(({ where }) => {
      if (where.code) {
        return Promise.resolve(mockPromos.find((p) => p.code === where.code) || null);
      }
      return Promise.resolve(null);
    }),
    find: jest.fn(({ where }) => {
      if (where && where.isActive) {
        return Promise.resolve(mockPromos.filter((p) => p.isActive));
      }
      return Promise.resolve(mockPromos);
    }),
    increment: jest.fn(({ code }, field, count) => {
      const p = mockPromos.find((item) => item.code === code);
      if (p) {
        (p as any)[field] = ((p as any)[field] || 0) + count;
      }
      return Promise.resolve({ affected: 1 });
    }),
  };

  const mockReferralRepo = {
    create: jest.fn((dto) => ({ id: 'ref-uuid-1', ...dto })),
    save: jest.fn((entity) => {
      mockReferrals.push(entity);
      return Promise.resolve(entity);
    }),
    findOne: jest.fn(({ where }) => {
      if (where.referredUserId && where.status) {
        return Promise.resolve(
          mockReferrals.find(
            (r) => r.referredUserId === where.referredUserId && r.status === where.status,
          ) || null,
        );
      }
      if (where.referredUserId) {
        return Promise.resolve(
          mockReferrals.find((r) => r.referredUserId === where.referredUserId) || null,
        );
      }
      if (where.referralCode) {
        return Promise.resolve(
          mockReferrals.find((r) => r.referralCode === where.referralCode) || null,
        );
      }
      return Promise.resolve(null);
    }),
    find: jest.fn(({ where }) => {
      if (where.userId) {
        return Promise.resolve(mockReferrals.filter((r) => r.userId === where.userId));
      }
      return Promise.resolve(mockReferrals);
    }),
  };

  const mockEntityManager = {
    create: jest.fn((_entityClass, dto) => ({ id: `uuid-${Math.random()}`, ...dto })),
    save: jest.fn((entityClassOrEntities, maybeEntities) => {
      const toSave = maybeEntities || entityClassOrEntities;
      const list = Array.isArray(toSave) ? toSave : [toSave];
      list.forEach((item) => {
        if (item.entryType) {
          mockLedgerEntries.push(item);
        } else if (item.referralCode) {
          const idx = mockReferrals.findIndex((r) => r.id === item.id);
          if (idx >= 0) {
            mockReferrals[idx] = item;
          } else {
            mockReferrals.push(item);
          }
        }
      });
      return Promise.resolve(toSave);
    }),
  };

  const mockDataSource = {
    transaction: jest.fn(async (cb) => {
      return cb(mockEntityManager);
    }),
  };

  beforeEach(async () => {
    mockPromos.length = 0;
    mockReferrals.length = 0;
    mockLedgerEntries.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        LoyaltyService,
        { provide: getRepositoryToken(PromoCode), useValue: mockPromoRepo },
        { provide: getRepositoryToken(UserReferral), useValue: mockReferralRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
  });

  describe('Promotional Code Vouchers', () => {
    it('should create a flat discount promo code successfully', async () => {
      const created = await service.createPromoCode({
        code: 'AMARAVATHI50',
        discountType: PromoDiscountType.FLAT_DISCOUNT,
        discountValue: 5000, // ₹50.00
        maxDiscountPaise: 5000,
        minFarePaise: 15000, // ₹150.00
        applicableService: PromoApplicableService.PASSENGER_RIDE,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
      });

      expect(created.code).toBe('AMARAVATHI50');
      expect(created.discountValue).toBe(5000);
      expect(created.isActive).toBe(true);
    });

    it('should reject creating duplicate promo code', async () => {
      await service.createPromoCode({
        code: 'VIJAYAWADA20',
        discountType: PromoDiscountType.PERCENTAGE_DISCOUNT,
        discountValue: 20,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
      });

      await expect(
        service.createPromoCode({
          code: 'VIJAYAWADA20',
          discountType: PromoDiscountType.PERCENTAGE_DISCOUNT,
          discountValue: 20,
          validFrom: '2026-01-01T00:00:00.000Z',
          validUntil: '2026-12-31T23:59:59.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate and calculate flat discount accurately', async () => {
      await service.createPromoCode({
        code: 'GUNTUR50',
        discountType: PromoDiscountType.FLAT_DISCOUNT,
        discountValue: 5000, // ₹50
        minFarePaise: 10000, // ₹100
        maxDiscountPaise: 5000,
        validFrom: '2025-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
      });

      const res = await service.validatePromoCode({
        code: 'GUNTUR50',
        farePaise: 20000, // ₹200.00
      });

      expect(res.isValid).toBe(true);
      expect(res.discountPaise).toBe(5000);
      expect(res.finalFarePaise).toBe(15000);
      expect(res.formattedDiscount).toBe('₹50.00');
      expect(res.formattedFinalFare).toBe('₹150.00');
    });

    it('should enforce percentage discount cap correctly', async () => {
      await service.createPromoCode({
        code: 'SAVE50PCT',
        discountType: PromoDiscountType.PERCENTAGE_DISCOUNT,
        discountValue: 50, // 50%
        minFarePaise: 5000,
        maxDiscountPaise: 7500, // Max cap ₹75.00
        validFrom: '2025-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
      });

      // Fare is ₹300 (30000 paise). 50% is 15000, capped at 7500 paise (₹75)
      const res = await service.validatePromoCode({
        code: 'SAVE50PCT',
        farePaise: 30000,
      });

      expect(res.isValid).toBe(true);
      expect(res.discountPaise).toBe(7500);
      expect(res.finalFarePaise).toBe(22500);
    });

    it('should reject promo if fare is lower than minimum fare requirement', async () => {
      await service.createPromoCode({
        code: 'MIN200',
        discountType: PromoDiscountType.FLAT_DISCOUNT,
        discountValue: 4000,
        minFarePaise: 20000, // ₹200 minimum
        validFrom: '2025-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
      });

      const res = await service.validatePromoCode({
        code: 'MIN200',
        farePaise: 15000, // ₹150 (< ₹200)
      });

      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toContain('Minimum trip fare of ₹200.00 required');
      expect(res.discountPaise).toBe(0);
      expect(res.finalFarePaise).toBe(15000);
    });

    it('should reject expired promo code', async () => {
      await service.createPromoCode({
        code: 'EXPIRED10',
        discountType: PromoDiscountType.FLAT_DISCOUNT,
        discountValue: 1000,
        validFrom: '2024-01-01T00:00:00.000Z',
        validUntil: '2024-12-31T23:59:59.000Z', // Expired
      });

      const res = await service.validatePromoCode({
        code: 'EXPIRED10',
        farePaise: 10000,
      });

      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toContain('expired');
    });

    it('should reject promo code if service category does not match', async () => {
      await service.createPromoCode({
        code: 'CARGOONLY',
        discountType: PromoDiscountType.FLAT_DISCOUNT,
        discountValue: 2000,
        applicableService: PromoApplicableService.CARGO_DELIVERY,
        validFrom: '2025-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
      });

      const res = await service.validatePromoCode({
        code: 'CARGOONLY',
        farePaise: 10000,
        serviceCategory: PromoApplicableService.PASSENGER_RIDE,
      });

      expect(res.isValid).toBe(false);
      expect(res.rejectionReason).toContain('only applicable to CARGO_DELIVERY');
    });
  });

  describe('User Referral System & Double-Entry Ledger Rewards', () => {
    const referrerId = '11111111-0000-0000-0000-000000000001';
    const refereeId = '22222222-0000-0000-0000-000000000002';

    it('should generate referral code for user', async () => {
      const refData = await service.getOrCreateReferralCode(referrerId);
      expect(refData.referralCode).toBe('ECO-REF-11111111');
      expect(refData.totalInvited).toBe(0);
      expect(refData.totalEarnedPaise).toBe(0);
    });

    it('should apply referral code successfully', async () => {
      const referral = await service.applyReferralCode(refereeId, 'ECO-REF-11111111');
      expect(referral.status).toBe('PENDING');
      expect(referral.referredUserId).toBe(refereeId);
    });

    it('should prevent self-referral', async () => {
      await expect(
        service.applyReferralCode(referrerId, 'ECO-REF-11111111'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent duplicate referral application', async () => {
      await service.applyReferralCode(refereeId, 'ECO-REF-11111111');
      await expect(
        service.applyReferralCode(refereeId, 'ECO-REF-99999999'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce minimum first ride fare for referral reward', async () => {
      await service.applyReferralCode(refereeId, 'ECO-REF-11111111');
      const res = await service.completeReferralReward(refereeId, 5000); // ₹50 (< ₹100 threshold)
      expect(res.success).toBe(false);
      expect(res.message).toContain('does not meet minimum ₹100.00 threshold');
    });

    it('should execute double-entry ledger balance settlement on qualifying first trip', async () => {
      await service.applyReferralCode(refereeId, 'ECO-REF-11111111');
      const res = await service.completeReferralReward(refereeId, 15000); // ₹150 (> ₹100 threshold)
      expect(res.success).toBe(true);
      expect(res.referrerRewardPaise).toBe(5000); // ₹50
      expect(res.refereeRewardPaise).toBe(2500);  // ₹25

      // Verify double-entry ledger entries created
      expect(mockLedgerEntries.length).toBe(4);

      const debits = mockLedgerEntries.filter((e) => e.entryType === 'DEBIT');
      const credits = mockLedgerEntries.filter((e) => e.entryType === 'CREDIT');

      const totalDebitPaise = debits.reduce((sum, e) => sum + e.amountPaise, 0);
      const totalCreditPaise = credits.reduce((sum, e) => sum + e.amountPaise, 0);

      // Strict parity check
      expect(totalDebitPaise).toBe(7500);
      expect(totalCreditPaise).toBe(7500);
      expect(totalDebitPaise).toBe(totalCreditPaise);

      // Verify accounts debited and credited
      expect(debits.every((d) => d.accountId === 'platform:marketing_promotions')).toBe(true);
      expect(credits.some((c) => c.accountId === `rider:${refereeId}:wallet`)).toBe(true);
    });
  });

  describe('Andhra Pradesh DLT Notification Rendering', () => {
    it('should render Telugu DLT notification for booking confirmation', () => {
      const rendered = service.renderNotification('BOOKING_CONFIRMED', 'te', {
        bookingCode: 'ECO-VJA-001',
        captainName: 'Ramesh',
        vehicleNumber: 'AP 16 EV 1234',
        otp: '4821',
      });

      expect(rendered.dltTemplateId).toBe('DLT-AP-1002');
      expect(rendered.message).toContain('Mee EV ride ECO-VJA-001 confirm ayyindi');
      expect(rendered.message).toContain('Captain: Ramesh');
      expect(rendered.message).toContain('4821');
    });

    it('should render English DLT notification for captain arrival', () => {
      const rendered = service.renderNotification('CAPTAIN_ARRIVED', 'en', {
        captainName: 'Suresh',
        vehicleNumber: 'AP 07 EV 5678',
        otp: '9123',
      });

      expect(rendered.dltTemplateId).toBe('DLT-AP-1003');
      expect(rendered.message).toContain('Captain Suresh has arrived');
      expect(rendered.message).toContain('9123');
    });
  });
});
