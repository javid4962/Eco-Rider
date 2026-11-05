import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CalculateSubsidyRequestDto,
  SubsidyBreakdownDto,
  SubsidyType,
} from '@ecoride/contracts';
import { CorporateSubsidyPolicy } from '../../database/entities/corporate-subsidy-policy.entity';
import { EmployeeSubsidyClaim } from '../../database/entities/employee-subsidy-claim.entity';

@Injectable()
export class CorporateSubsidyService {
  constructor(
    @InjectRepository(CorporateSubsidyPolicy)
    private readonly policyRepo: Repository<CorporateSubsidyPolicy>,
    @InjectRepository(EmployeeSubsidyClaim)
    private readonly claimRepo: Repository<EmployeeSubsidyClaim>,
  ) {}

  async calculateSubsidy(dto: CalculateSubsidyRequestDto): Promise<SubsidyBreakdownDto> {
    const policy = await this.policyRepo.findOne({
      where: { corporateAccountId: dto.corporateAccountId, isActive: true },
    });

    if (!policy) {
      return {
        totalFarePaise: dto.farePaise,
        subsidizedAmountPaise: 0,
        employeeRemainingPaise: dto.farePaise,
        subsidyApplied: false,
        notes: 'No active corporate subsidy policy found',
      };
    }

    // Check allowed zones if configured
    if (policy.allowedZones && policy.allowedZones.length > 0) {
      if (!policy.allowedZones.includes(dto.pickupZone)) {
        return {
          totalFarePaise: dto.farePaise,
          subsidizedAmountPaise: 0,
          employeeRemainingPaise: dto.farePaise,
          subsidyApplied: false,
          notes: `Zone ${dto.pickupZone} is not authorized for corporate subsidy`,
        };
      }
    }

    let calculatedSubsidyPaise = 0;
    if (policy.subsidyType === SubsidyType.FULL_100_PERCENT) {
      calculatedSubsidyPaise = dto.farePaise;
    } else if (policy.subsidyType === SubsidyType.PERCENTAGE_SPLIT) {
      const pct = Number(policy.subsidyPercentage) / 100.0;
      calculatedSubsidyPaise = Math.round(dto.farePaise * pct);
    } else {
      calculatedSubsidyPaise = Math.min(dto.farePaise, policy.maxPerTripSubsidyPaise);
    }

    // Enforce per-trip ceiling
    if (policy.maxPerTripSubsidyPaise && policy.maxPerTripSubsidyPaise > 0) {
      calculatedSubsidyPaise = Math.min(calculatedSubsidyPaise, policy.maxPerTripSubsidyPaise);
    }

    const employeeRemainingPaise = Math.max(0, dto.farePaise - calculatedSubsidyPaise);

    return {
      totalFarePaise: dto.farePaise,
      subsidizedAmountPaise: calculatedSubsidyPaise,
      employeeRemainingPaise,
      subsidyApplied: true,
      notes: `Applied ${policy.subsidyPercentage || 100}% employer subsidy`,
    };
  }

  async recordClaim(bookingId: string, employeeUserId: string, corporateAccountId: string, totalFarePaise: number, subsidizedPaise: number): Promise<void> {
    const claim = this.claimRepo.create({
      bookingId,
      employeeUserId,
      corporateAccountId,
      totalTripFarePaise: totalFarePaise,
      employerSubsidizedPaise: subsidizedPaise,
      employeePayablePaise: Math.max(0, totalFarePaise - subsidizedPaise),
    });
    await this.claimRepo.save(claim);
  }
}
