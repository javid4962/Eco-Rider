import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { PromoCode } from '../../database/entities/promo-code.entity';
import { UserReferral } from '../../database/entities/user-referral.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import {
  PromoDiscountType,
  PromoApplicableService,
  CreatePromoCodeDto,
  ValidatePromoCodeDto,
  PromoDiscountResult,
  ReferralCodeDto,
  ReferralRewardResult,
} from '@ecoride/contracts';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
    @InjectRepository(UserReferral)
    private readonly referralRepo: Repository<UserReferral>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new marketing promotional discount code
   */
  async createPromoCode(dto: CreatePromoCodeDto): Promise<PromoCode> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const existing = await this.promoRepo.findOne({ where: { code: normalizedCode } });
    if (existing) {
      throw new BadRequestException(`Promo code ${normalizedCode} already exists`);
    }

    const promo = this.promoRepo.create({
      code: normalizedCode,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxDiscountPaise: dto.maxDiscountPaise ?? 5000,
      minFarePaise: dto.minFarePaise ?? 3000,
      applicableService: dto.applicableService ?? PromoApplicableService.ALL,
      usageLimitPerUser: dto.usageLimitPerUser ?? 1,
      totalUsageLimit: dto.totalUsageLimit ?? 1000,
      validFrom: new Date(dto.validFrom),
      validUntil: new Date(dto.validUntil),
      isActive: true,
    });

    return this.promoRepo.save(promo);
  }

  /**
   * List active promotional vouchers
   */
  async listPromoCodes(activeOnly = true): Promise<PromoCode[]> {
    if (activeOnly) {
      return this.promoRepo.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    }
    return this.promoRepo.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Authoritatively validate a promo code and compute integer discount in paise
   */
  async validatePromoCode(
    dto: ValidatePromoCodeDto,
    _userId?: string,
  ): Promise<PromoDiscountResult> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const promo = await this.promoRepo.findOne({ where: { code: normalizedCode } });

    if (!promo || !promo.isActive) {
      return {
        code: normalizedCode,
        originalFarePaise: dto.farePaise,
        discountPaise: 0,
        finalFarePaise: dto.farePaise,
        formattedDiscount: '₹0.00',
        formattedFinalFare: `₹${(dto.farePaise / 100).toFixed(2)}`,
        isValid: false,
        rejectionReason: 'Promo code is invalid or deactivated',
      };
    }

    const now = new Date();
    if (now < new Date(promo.validFrom) || now > new Date(promo.validUntil)) {
      return {
        code: normalizedCode,
        originalFarePaise: dto.farePaise,
        discountPaise: 0,
        finalFarePaise: dto.farePaise,
        formattedDiscount: '₹0.00',
        formattedFinalFare: `₹${(dto.farePaise / 100).toFixed(2)}`,
        isValid: false,
        rejectionReason: 'Promo code has expired or is not yet active',
      };
    }

    if (promo.currentUsageCount >= promo.totalUsageLimit) {
      return {
        code: normalizedCode,
        originalFarePaise: dto.farePaise,
        discountPaise: 0,
        finalFarePaise: dto.farePaise,
        formattedDiscount: '₹0.00',
        formattedFinalFare: `₹${(dto.farePaise / 100).toFixed(2)}`,
        isValid: false,
        rejectionReason: 'Promo code total usage limit has been reached',
      };
    }

    const minFare = Number(promo.minFarePaise);
    if (dto.farePaise < minFare) {
      return {
        code: normalizedCode,
        originalFarePaise: dto.farePaise,
        discountPaise: 0,
        finalFarePaise: dto.farePaise,
        formattedDiscount: '₹0.00',
        formattedFinalFare: `₹${(dto.farePaise / 100).toFixed(2)}`,
        isValid: false,
        rejectionReason: `Minimum trip fare of ₹${(minFare / 100).toFixed(2)} required to apply this code`,
      };
    }

    // Check service applicability if specified
    if (
      promo.applicableService !== PromoApplicableService.ALL &&
      dto.serviceCategory &&
      promo.applicableService !== dto.serviceCategory
    ) {
      return {
        code: normalizedCode,
        originalFarePaise: dto.farePaise,
        discountPaise: 0,
        finalFarePaise: dto.farePaise,
        formattedDiscount: '₹0.00',
        formattedFinalFare: `₹${(dto.farePaise / 100).toFixed(2)}`,
        isValid: false,
        rejectionReason: `Promo code is only applicable to ${promo.applicableService}`,
      };
    }

    // Calculate discount in integer paise
    let discountPaise = 0;
    const maxDiscount = Number(promo.maxDiscountPaise);

    if (promo.discountType === PromoDiscountType.FLAT_DISCOUNT) {
      discountPaise = Math.min(Number(promo.discountValue), maxDiscount, dto.farePaise);
    } else if (promo.discountType === PromoDiscountType.PERCENTAGE_DISCOUNT) {
      const percentageCalc = Math.round((dto.farePaise * Number(promo.discountValue)) / 100);
      discountPaise = Math.min(percentageCalc, maxDiscount, dto.farePaise);
    }

    const finalFarePaise = Math.max(0, dto.farePaise - discountPaise);

    return {
      code: normalizedCode,
      originalFarePaise: dto.farePaise,
      discountPaise,
      finalFarePaise,
      formattedDiscount: `₹${(discountPaise / 100).toFixed(2)}`,
      formattedFinalFare: `₹${(finalFarePaise / 100).toFixed(2)}`,
      isValid: true,
    };
  }

  /**
   * Consume promo code usage
   */
  async recordPromoUsage(code: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    await this.promoRepo.increment({ code: normalizedCode }, 'currentUsageCount', 1);
  }

  /**
   * Get or generate user's referral code & program stats
   */
  async getOrCreateReferralCode(userId: string): Promise<ReferralCodeDto> {
    const cleanId = userId.replace(/-/g, '').substring(0, 8).toUpperCase();
    const referralCode = `ECO-REF-${cleanId}`;

    const referrals = await this.referralRepo.find({ where: { userId } });
    const totalInvited = referrals.length;
    const totalCompleted = referrals.filter((r) => r.status === 'COMPLETED').length;
    const totalEarnedPaise = referrals
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + Number(r.rewardPaidPaise), 0);

    return {
      referralCode,
      userId,
      totalInvited,
      totalCompleted,
      totalEarnedPaise,
      formattedTotalEarned: `₹${(totalEarnedPaise / 100).toFixed(2)}`,
    };
  }

  /**
   * Apply a friend's referral code during signup or onboarding
   */
  async applyReferralCode(refereeUserId: string, referralCode: string): Promise<UserReferral> {
    const normalizedCode = referralCode.trim().toUpperCase();

    // Check if referee already has a referral applied
    const existingApplication = await this.referralRepo.findOne({
      where: { referredUserId: refereeUserId },
    });
    if (existingApplication) {
      throw new BadRequestException('Referral code has already been applied for this account');
    }

    // Derive referrer's ID prefix or lookup code in referral table
    const cleanCode = normalizedCode.replace('ECO-REF-', '').toLowerCase();
    const referrerIdGuess = refereeUserId.replace(/-/g, '').substring(0, 8).toLowerCase();
    if (cleanCode === referrerIdGuess) {
      throw new BadRequestException('Cannot apply your own referral code');
    }

    // Find referrer record or user
    const referrerRecord = await this.referralRepo.findOne({
      where: { referralCode: normalizedCode },
    });

    let referrerUserId: string;
    if (referrerRecord) {
      referrerUserId = referrerRecord.userId;
    } else {
      // Synthetic/Deterministic referrer lookup
      referrerUserId = `ref-${cleanCode}`;
    }

    if (referrerUserId === refereeUserId) {
      throw new BadRequestException('Cannot apply your own referral code');
    }

    const referral = this.referralRepo.create({
      userId: referrerUserId,
      referralCode: normalizedCode,
      referredUserId: refereeUserId,
      status: 'PENDING',
      rewardPaidPaise: 0,
    });

    return this.referralRepo.save(referral);
  }

  /**
   * Process double-entry promotional reward on completion of first qualifying trip
   */
  async completeReferralReward(
    refereeUserId: string,
    firstRideFarePaise: number,
  ): Promise<ReferralRewardResult> {
    const minFirstRideFare = 10000; // ₹100.00
    if (firstRideFarePaise < minFirstRideFare) {
      return {
        success: false,
        referrerId: '',
        refereeId: refereeUserId,
        referrerRewardPaise: 0,
        refereeRewardPaise: 0,
        message: `Ride fare ₹${(firstRideFarePaise / 100).toFixed(2)} does not meet minimum ₹${(minFirstRideFare / 100).toFixed(2)} threshold for referral bonus`,
      };
    }

    const pendingReferral = await this.referralRepo.findOne({
      where: { referredUserId: refereeUserId, status: 'PENDING' },
    });

    if (!pendingReferral) {
      return {
        success: false,
        referrerId: '',
        refereeId: refereeUserId,
        referrerRewardPaise: 0,
        refereeRewardPaise: 0,
        message: 'No pending referral found for this user',
      };
    }

    const referrerRewardPaise = 5000; // ₹50.00
    const refereeRewardPaise = 2500;  // ₹25.00

    // Execute atomic double-entry ledger settlement
    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      // 1. Double-entry for Referrer:
      // DEBIT platform:marketing_promotions, CREDIT rider:<referrerId>:wallet
      const debitReferrer = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `ref-reward-debit-${pendingReferral.id}-referrer`,
        accountId: 'platform:marketing_promotions',
        entryType: 'DEBIT',
        amountPaise: referrerRewardPaise,
        currency: 'INR',
        description: `Referral bonus marketing payout for inviting user ${refereeUserId}`,
        createdAt: now,
      });

      const creditReferrer = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `ref-reward-credit-${pendingReferral.id}-referrer`,
        accountId: `rider:${pendingReferral.userId}:wallet`,
        entryType: 'CREDIT',
        amountPaise: referrerRewardPaise,
        currency: 'INR',
        description: `Referral bonus credit for inviting user ${refereeUserId}`,
        createdAt: now,
      });

      // 2. Double-entry for Referee:
      // DEBIT platform:marketing_promotions, CREDIT rider:<refereeId>:wallet
      const debitReferee = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `ref-reward-debit-${pendingReferral.id}-referee`,
        accountId: 'platform:marketing_promotions',
        entryType: 'DEBIT',
        amountPaise: refereeRewardPaise,
        currency: 'INR',
        description: `Welcome bonus marketing payout for signup via code ${pendingReferral.referralCode}`,
        createdAt: now,
      });

      const creditReferee = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `ref-reward-credit-${pendingReferral.id}-referee`,
        accountId: `rider:${refereeUserId}:wallet`,
        entryType: 'CREDIT',
        amountPaise: refereeRewardPaise,
        currency: 'INR',
        description: `Welcome bonus credit for first trip completed with code ${pendingReferral.referralCode}`,
        createdAt: now,
      });

      // Total DEBITS = 5000 + 2500 = 7500. Total CREDITS = 5000 + 2500 = 7500. STRICT PARITY.
      await manager.save(LedgerEntry, [debitReferrer, creditReferrer, debitReferee, creditReferee]);

      // Update referral status
      pendingReferral.status = 'COMPLETED';
      pendingReferral.rewardPaidPaise = referrerRewardPaise;
      pendingReferral.completedAt = now;
      await manager.save(UserReferral, pendingReferral);
    });

    return {
      success: true,
      referrerId: pendingReferral.userId,
      refereeId: refereeUserId,
      referrerRewardPaise,
      refereeRewardPaise,
      message: 'Referral rewards successfully credited via double-entry ledger balance',
    };
  }

  /**
   * Andhra Pradesh DLT compliant telecom notification renderer (Telugu & English)
   */
  renderNotification(
    template: 'BOOKING_CONFIRMED' | 'CAPTAIN_ARRIVED' | 'TRIP_STARTED' | 'TRIP_COMPLETED' | 'REFERRAL_REWARD',
    language: 'te' | 'en' = 'en',
    params: Record<string, string>,
  ): { message: string; dltTemplateId: string } {
    const templates: Record<string, { en: { dltId: string; text: string }; te: { dltId: string; text: string } }> = {
      BOOKING_CONFIRMED: {
        en: {
          dltId: 'DLT-AP-1001',
          text: `EcoRide AP: Your EV ride ${params.bookingCode || ''} is confirmed with Captain ${params.captainName || ''}. Vehicle: ${params.vehicleNumber || ''}. OTP: ${params.otp || ''}. Please board safely.`,
        },
        te: {
          dltId: 'DLT-AP-1002',
          text: `EcoRide AP: Mee EV ride ${params.bookingCode || ''} confirm ayyindi. Captain: ${params.captainName || ''}, Bandi: ${params.vehicleNumber || ''}. Start OTP: ${params.otp || ''}. Subhayatra!`,
        },
      },
      CAPTAIN_ARRIVED: {
        en: {
          dltId: 'DLT-AP-1003',
          text: `EcoRide AP: Captain ${params.captainName || ''} has arrived at your pickup location in ${params.vehicleNumber || ''}. Please share OTP ${params.otp || ''} to start ride.`,
        },
        te: {
          dltId: 'DLT-AP-1004',
          text: `EcoRide AP: Captain ${params.captainName || ''} mee pickup location ki cherukunnaru (${params.vehicleNumber || ''}). Ride start cheyyadaniki OTP ${params.otp || ''} cheppandi.`,
        },
      },
      REFERRAL_REWARD: {
        en: {
          dltId: 'DLT-AP-1005',
          text: `EcoRide AP: Congratulations! ₹${params.amountRupees || '50'} referral bonus has been credited to your EcoRide wallet for referring your friend.`,
        },
        te: {
          dltId: 'DLT-AP-1006',
          text: `EcoRide AP: Abhinandanalu! Mee friend EcoRide lo join ayinanduku mee wallet lo ₹${params.amountRupees || '50'} referral bonus credit ayyindi.`,
        },
      },
    };

    const config = templates[template] || templates.BOOKING_CONFIRMED;
    const selected = language === 'te' ? config.te : config.en;

    return {
      message: selected.text,
      dltTemplateId: selected.dltId,
    };
  }
}
