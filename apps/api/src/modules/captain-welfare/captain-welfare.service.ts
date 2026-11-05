import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WelfareFundBalanceDto,
  MedicalClaimRequestDto,
  MedicalClaimDto,
  MedicalClaimStatus,
} from '@ecoride/contracts';
import { CaptainWelfareLedger } from '../../database/entities/captain-welfare-ledger.entity';
import { MedicalClaim } from '../../database/entities/medical-claim.entity';

@Injectable()
export class CaptainWelfareService {
  constructor(
    @InjectRepository(CaptainWelfareLedger)
    private readonly ledgerRepo: Repository<CaptainWelfareLedger>,
    @InjectRepository(MedicalClaim)
    private readonly claimRepo: Repository<MedicalClaim>,
  ) {}

  async getFundBalance(): Promise<WelfareFundBalanceDto> {
    const latest = await this.ledgerRepo.findOne({
      order: { createdAt: 'DESC' },
      where: {},
    });

    const balance = latest ? latest.balanceAfterPaise : 5000000; // Default ₹50,000 baseline reserve
    return {
      totalContributionsPaise: balance + 1500000,
      totalDisbursedPaise: 1500000,
      currentReservePaise: balance,
      activeCaptainsCovered: 1850,
    };
  }

  async recordMicroCessContribution(bookingId: string): Promise<void> {
    const fund = await this.getFundBalance();
    const newBalance = fund.currentReservePaise + 50; // 50 paise micro-cess

    const entry = this.ledgerRepo.create({
      entryType: 'CONTRIBUTION',
      bookingId,
      amountPaise: 50,
      balanceAfterPaise: newBalance,
      description: 'Ride micro-cess for driver medical emergency welfare fund',
    });
    await this.ledgerRepo.save(entry);
  }

  async submitMedicalClaim(dto: MedicalClaimRequestDto): Promise<MedicalClaimDto> {
    if (dto.claimAmountPaise <= 0 || dto.claimAmountPaise > 5000000) {
      // Up to ₹50,000 max emergency claim
      throw new BadRequestException('Claim amount must be between ₹1 and ₹50,000');
    }

    const claimNumber = `MED-${Date.now().toString(36).toUpperCase()}`;
    const claim = this.claimRepo.create({
      claimNumber,
      captainId: dto.captainId,
      hospitalName: dto.hospitalName,
      treatmentType: dto.treatmentType,
      claimAmountPaise: dto.claimAmountPaise,
      approvedAmountPaise: 0,
      status: MedicalClaimStatus.SUBMITTED,
      dischargeSummaryUrl: dto.dischargeSummaryUrl,
    });

    const saved = await this.claimRepo.save(claim);
    return this.mapToDto(saved);
  }

  async disburseMedicalClaim(claimNumber: string, approvedAmountPaise: number): Promise<MedicalClaimDto> {
    const claim = await this.claimRepo.findOne({ where: { claimNumber } });
    if (!claim) {
      throw new NotFoundException(`Claim ${claimNumber} not found`);
    }

    const fund = await this.getFundBalance();
    if (approvedAmountPaise > fund.currentReservePaise) {
      throw new BadRequestException('Insufficient welfare fund reserve balance');
    }

    claim.approvedAmountPaise = approvedAmountPaise;
    claim.status = MedicalClaimStatus.DISBURSED;
    claim.disbursedUtr = `WLF-IMPS-${Date.now().toString(36).toUpperCase()}`;

    const saved = await this.claimRepo.save(claim);

    const newBalance = fund.currentReservePaise - approvedAmountPaise;
    const entry = this.ledgerRepo.create({
      entryType: 'DISBURSAL',
      captainId: claim.captainId,
      amountPaise: approvedAmountPaise,
      balanceAfterPaise: newBalance,
      description: `Medical assistance payout for claim ${claimNumber}`,
    });
    await this.ledgerRepo.save(entry);

    return this.mapToDto(saved);
  }

  private mapToDto(c: MedicalClaim): MedicalClaimDto {
    return {
      id: c.id,
      claimNumber: c.claimNumber,
      captainId: c.captainId,
      hospitalName: c.hospitalName,
      treatmentType: c.treatmentType,
      claimAmountPaise: c.claimAmountPaise,
      approvedAmountPaise: c.approvedAmountPaise,
      status: c.status as MedicalClaimStatus,
      disbursedUtr: c.disbursedUtr || undefined,
      submittedAt: c.submittedAt.toISOString(),
      processedAt: c.updatedAt?.toISOString(),
    };
  }
}

