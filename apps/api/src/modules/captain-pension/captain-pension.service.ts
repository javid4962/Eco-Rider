import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CaptainPensionAccountDto,
  EnrollPensionDto,
  RecordPensionDeductionDto,
} from '@ecoride/contracts';
import { CaptainPensionAccount } from '../../database/entities/captain-pension-account.entity';
import { PensionDeductionRecord } from '../../database/entities/pension-deduction-record.entity';

@Injectable()
export class CaptainPensionService {
  constructor(
    @InjectRepository(CaptainPensionAccount)
    private readonly accountRepo: Repository<CaptainPensionAccount>,
    @InjectRepository(PensionDeductionRecord)
    private readonly deductionRepo: Repository<PensionDeductionRecord>,
  ) {}

  async enrollPension(dto: EnrollPensionDto): Promise<CaptainPensionAccountDto> {
    if (!dto.captainId || !dto.pranNumber) {
      throw new BadRequestException('Captain ID and PRAN number are required for pension enrollment');
    }

    if (dto.dailyContributionPaise < 500) {
      throw new BadRequestException('Minimum daily voluntary pension contribution is 500 paise (₹5.00)');
    }

    const existing = await this.accountRepo.findOne({ where: { captainId: dto.captainId } });
    if (existing) {
      return this.mapToDto(existing);
    }

    const account = this.accountRepo.create({
      captainId: dto.captainId,
      pranNumber: dto.pranNumber,
      dailyContributionPaise: dto.dailyContributionPaise,
      totalAccumulatedPaise: 0,
      totalDaysContributed: 0,
      isActive: true,
    });

    const saved = await this.accountRepo.save(account);
    return this.mapToDto(saved);
  }

  async recordDeduction(dto: RecordPensionDeductionDto): Promise<CaptainPensionAccountDto> {
    const account = await this.accountRepo.findOne({ where: { captainId: dto.captainId, isActive: true } });
    if (!account) {
      throw new NotFoundException(`Active pension account for captain ${dto.captainId} not found`);
    }

    if (dto.deductionAmountPaise <= 0) {
      throw new BadRequestException('Deduction amount must be greater than zero');
    }

    account.totalAccumulatedPaise = Number(account.totalAccumulatedPaise) + dto.deductionAmountPaise;
    account.totalDaysContributed += 1;
    await this.accountRepo.save(account);

    const record = this.deductionRepo.create({
      captainId: dto.captainId,
      tripId: dto.tripId || null,
      deductionAmountPaise: dto.deductionAmountPaise,
      accumulatedBalanceAfterPaise: account.totalAccumulatedPaise,
    });
    await this.deductionRepo.save(record);

    return this.mapToDto(account);
  }

  private mapToDto(a: CaptainPensionAccount): CaptainPensionAccountDto {
    return {
      id: a.id,
      captainId: a.captainId,
      pranNumber: a.pranNumber,
      dailyContributionPaise: a.dailyContributionPaise,
      totalAccumulatedPaise: Number(a.totalAccumulatedPaise),
      totalDaysContributed: a.totalDaysContributed,
      isActive: a.isActive,
      enrolledAt: a.enrolledAt ? a.enrolledAt.toISOString() : new Date().toISOString(),
    };
  }
}
