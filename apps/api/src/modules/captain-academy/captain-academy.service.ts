import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptainTrainingCertification } from '../../database/entities/captain-training-certification.entity';
import {
  CaptainCertificationDto,
  CaptainAcademyBadgeResult,
} from '@ecoride/contracts';

@Injectable()
export class CaptainAcademyService {
  constructor(
    @InjectRepository(CaptainTrainingCertification)
    private readonly certRepo: Repository<CaptainTrainingCertification>,
  ) {}

  async processCertification(dto: CaptainCertificationDto): Promise<CaptainAcademyBadgeResult> {
    const passed = dto.examScorePercent >= 80.0;
    let awardedBadge = 'NONE';
    let commissionDiscountBps = 0;

    if (passed) {
      if (dto.ecoDrivingEfficiencyKwhPer100Km <= 12.0) {
        awardedBadge = 'MASTER_ECO_PILOT_2026';
        commissionDiscountBps = 200; // 2% discount
      } else {
        awardedBadge = 'CERTIFIED_EV_PILOT';
        commissionDiscountBps = 100; // 1% discount
      }
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 365);

    const cert = this.certRepo.create({
      captainId: dto.captainId,
      courseType: dto.courseType,
      examScorePercent: dto.examScorePercent,
      ecoDrivingKwhPer100Km: dto.ecoDrivingEfficiencyKwhPer100Km,
      passed,
      awardedBadge,
      commissionDiscountBps,
      validUntil,
      verificationUrl: `https://verify.ecoride.in/academy/certs/${dto.captainId}`,
    });

    const saved = await this.certRepo.save(cert);

    return {
      certificateId: saved.id,
      captainId: saved.captainId,
      courseType: saved.courseType as any,
      passed,
      awardedBadge,
      platformCommissionDiscountBps: commissionDiscountBps,
      expiryDate: validUntil.toISOString(),
      verificationUrl: saved.verificationUrl,
    };
  }

  async getCertificationsForCaptain(captainId: string): Promise<CaptainTrainingCertification[]> {
    return await this.certRepo.find({ where: { captainId } });
  }
}
