import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CaptainEmiPlanDto,
  ExecuteDailyEmiDeductionDto,
  EmiDeductionResultDto,
  LoanStatus,
} from '@ecoride/contracts';
import { CaptainEmiPlan } from '../../database/entities/captain-emi-plan.entity';
import { EmiDeductionRecord } from '../../database/entities/emi-deduction-record.entity';

@Injectable()
export class DriverMicrofinanceService {
  constructor(
    @InjectRepository(CaptainEmiPlan)
    private readonly planRepo: Repository<CaptainEmiPlan>,
    @InjectRepository(EmiDeductionRecord)
    private readonly deductionRepo: Repository<EmiDeductionRecord>,
  ) {}

  async getCaptainLoanPlan(captainId: string): Promise<CaptainEmiPlanDto | null> {
    const plan = await this.planRepo.findOne({ where: { captainId, status: 'ACTIVE' } });
    if (!plan) return null;
    return this.mapToDto(plan);
  }

  /**
   * Executes daily automated microfinance deduction with AP livelihood safety cap (max 25%)
   */
  async executeDailyDeduction(dto: ExecuteDailyEmiDeductionDto): Promise<EmiDeductionResultDto> {
    const plan = await this.planRepo.findOne({ where: { captainId: dto.captainId, status: 'ACTIVE' } });
    if (!plan) {
      throw new NotFoundException(`No active loan financing plan found for captain ${dto.captainId}`);
    }

    const maxDeductionAllowed = Math.floor(dto.grossEarningsTodayPaise * (Number(plan.maxDeductionCapPercentage) / 100.0));
    const requestedEmi = Math.min(plan.dailyEmiInstallmentPaise, plan.remainingBalancePaise);

    const isCapped = requestedEmi > maxDeductionAllowed;
    const actualDeductionPaise = isCapped ? Math.max(0, maxDeductionAllowed) : requestedEmi;

    plan.remainingBalancePaise = Math.max(0, plan.remainingBalancePaise - actualDeductionPaise);
    plan.totalPaidPaise += actualDeductionPaise;
    if (plan.remainingBalancePaise === 0) {
      plan.status = LoanStatus.CLOSED;
    }
    await this.planRepo.save(plan);

    const record = this.deductionRepo.create({
      planId: plan.id,
      captainId: dto.captainId,
      deductionDate: dto.date,
      grossEarningsPaise: dto.grossEarningsTodayPaise,
      requestedEmiPaise: requestedEmi,
      actualDeductedPaise: actualDeductionPaise,
      escrowTransferredPaise: actualDeductionPaise,
      cappedBySafetyRule: isCapped,
      notes: isCapped
        ? `Livelihood guard applied: Deducted 25% max (₹${(actualDeductionPaise / 100).toFixed(2)}) instead of scheduled ₹${(requestedEmi / 100).toFixed(2)}`
        : 'Full scheduled daily EMI deducted and escrowed to lender',
    });

    const saved = await this.deductionRepo.save(record);

    return {
      deductionId: saved.id,
      captainId: saved.captainId,
      grossEarningsPaise: saved.grossEarningsPaise,
      requestedEmiPaise: saved.requestedEmiPaise,
      actualDeductedPaise: saved.actualDeductedPaise,
      escrowTransferredToLenderPaise: saved.escrowTransferredPaise,
      remainingLenderBalancePaise: plan.remainingBalancePaise,
      cappedBySafetyRule: saved.cappedBySafetyRule,
      notes: saved.notes || '',
    };
  }

  private mapToDto(p: CaptainEmiPlan): CaptainEmiPlanDto {
    return {
      id: p.id,
      captainId: p.captainId,
      lenderName: p.lenderName,
      loanAccountNumber: p.loanAccountNumber,
      totalPrincipalPaise: p.totalPrincipalPaise,
      totalInterestPaise: p.totalInterestPaise,
      dailyEmiInstallmentPaise: p.dailyEmiInstallmentPaise,
      remainingBalancePaise: p.remainingBalancePaise,
      totalPaidPaise: p.totalPaidPaise,
      maxDeductionCapPercentage: Number(p.maxDeductionCapPercentage),
      status: p.status as LoanStatus,
      startDate: p.startDate,
      endDate: p.endDate,
    };
  }
}

