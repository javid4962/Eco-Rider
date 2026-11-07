import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { CorporateGreenProfile } from '../../database/entities/corporate-green-profile.entity';
import {
  GreenBadgeTier,
  RecordGreenTripDto,
  GreenCommuteProfileResult,
  CorporateOffsetPurchaseDto,
  CorporateOffsetReceipt,
} from '@ecoride/contracts';

@Injectable()
export class CorporateGreenCommuteService {
  constructor(
    @InjectRepository(CorporateGreenProfile)
    private readonly profileRepo: Repository<CorporateGreenProfile>,
  ) {}

  async recordGreenTrip(dto: RecordGreenTripDto): Promise<GreenCommuteProfileResult> {
    if (dto.distanceKm <= 0) {
      throw new BadRequestException('Distance must be greater than zero');
    }

    let profile = await this.profileRepo.findOne({ where: { employeeId: dto.employeeId } });

    if (!profile) {
      profile = this.profileRepo.create({
        employeeId: dto.employeeId,
        corporateAccountId: dto.corporateAccountId,
        totalElectricKm: 0,
        totalKgCo2Saved: 0,
        currentTier: GreenBadgeTier.BRONZE_COMMUTER,
        greenPoints: 0,
        unlockedBadges: [],
      });
    }

    const co2SavedDelta = dto.distanceKm * 0.162; // 162g CO2 per km avoided
    const pointsDelta = Math.round(dto.distanceKm * 10);

    profile.totalElectricKm = Number(profile.totalElectricKm) + dto.distanceKm;
    profile.totalKgCo2Saved = Number(profile.totalKgCo2Saved) + co2SavedDelta;
    profile.greenPoints = Number(profile.greenPoints) + pointsDelta;

    const badges = new Set<string>(profile.unlockedBadges || []);
    badges.add('FIRST_CLEAN_COMMUTE');

    if (profile.totalElectricKm >= 1000) {
      profile.currentTier = GreenBadgeTier.PLATINUM_NET_ZERO_HERO;
      badges.add('PLATINUM_NET_ZERO_HERO');
      badges.add('THOUSAND_KM_CLUB');
    } else if (profile.totalElectricKm >= 500) {
      profile.currentTier = GreenBadgeTier.GOLD_CARBON_SAVER;
      badges.add('GOLD_CARBON_SAVER');
    } else if (profile.totalElectricKm >= 100) {
      profile.currentTier = GreenBadgeTier.SILVER_ECO_RIDER;
      badges.add('SILVER_ECO_RIDER');
      badges.add('CENTURY_RIDER');
    } else {
      profile.currentTier = GreenBadgeTier.BRONZE_COMMUTER;
    }

    profile.unlockedBadges = Array.from(badges);
    const saved = await this.profileRepo.save(profile);

    return {
      employeeId: saved.employeeId,
      corporateAccountId: saved.corporateAccountId,
      totalElectricKm: Number(Number(saved.totalElectricKm).toFixed(2)),
      totalKgCo2Saved: Number(Number(saved.totalKgCo2Saved).toFixed(2)),
      currentTier: saved.currentTier,
      greenPoints: saved.greenPoints,
      unlockedBadges: saved.unlockedBadges,
      updatedAt: saved.updatedAt ? saved.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async purchaseCorporateOffset(dto: CorporateOffsetPurchaseDto): Promise<CorporateOffsetReceipt> {
    if (dto.metricTonsCo2ToOffset <= 0 || dto.offsetCostPaisePerTon <= 0) {
      throw new BadRequestException('Offset metric tons and cost must be positive');
    }

    const totalPaidPaise = Math.round(dto.metricTonsCo2ToOffset * dto.offsetCostPaisePerTon);
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const certificateRef = `AP-GREEN-VCM-${dto.corporateAccountId.substring(0, 4)}-${suffix}`;

    return {
      purchaseId: crypto.randomUUID(),
      corporateAccountId: dto.corporateAccountId,
      metricTonsCo2Offset: dto.metricTonsCo2ToOffset,
      totalPaidPaise,
      certificateRef,
      issuedAt: new Date().toISOString(),
    };
  }
}
