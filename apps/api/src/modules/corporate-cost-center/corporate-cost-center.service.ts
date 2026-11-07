import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorporateCostCenter } from '../../database/entities/corporate-cost-center.entity';
import {
  CostCenterStatus,
  CreateCostCenterDto,
  AuthorizeCorporateRideDto,
  CostCenterAuthorizationResult,
} from '@ecoride/contracts';

@Injectable()
export class CorporateCostCenterService {
  constructor(
    @InjectRepository(CorporateCostCenter)
    private readonly costCenterRepo: Repository<CorporateCostCenter>,
  ) {}

  async createCostCenter(dto: CreateCostCenterDto): Promise<CorporateCostCenter> {
    if (dto.monthlyBudgetLimitPaise <= 0) {
      throw new BadRequestException('Monthly budget limit must be positive');
    }

    const costCenter = this.costCenterRepo.create({
      corporateAccountId: dto.corporateAccountId,
      departmentCode: dto.departmentCode,
      departmentName: dto.departmentName,
      monthlyBudgetLimitPaise: dto.monthlyBudgetLimitPaise,
      currentSpendPaise: 0,
      status: CostCenterStatus.ACTIVE,
    });

    return this.costCenterRepo.save(costCenter);
  }

  async authorizeRide(dto: AuthorizeCorporateRideDto): Promise<CostCenterAuthorizationResult> {
    const costCenter = await this.costCenterRepo.findOne({
      where: {
        corporateAccountId: dto.corporateAccountId,
        departmentCode: dto.departmentCode,
      },
    });

    if (!costCenter) {
      throw new NotFoundException('Corporate cost center not found');
    }

    if (costCenter.status !== CostCenterStatus.ACTIVE) {
      return {
        isApproved: false,
        costCenterId: costCenter.id,
        departmentCode: costCenter.departmentCode,
        currentSpendPaise: Number(costCenter.currentSpendPaise),
        monthlyBudgetLimitPaise: Number(costCenter.monthlyBudgetLimitPaise),
        remainingBudgetPaise: Math.max(0, Number(costCenter.monthlyBudgetLimitPaise) - Number(costCenter.currentSpendPaise)),
        rejectionReason: `Cost center is ${costCenter.status}`,
      };
    }

    const projectedSpend = Number(costCenter.currentSpendPaise) + dto.estimatedFarePaise;

    if (projectedSpend > Number(costCenter.monthlyBudgetLimitPaise)) {
      return {
        isApproved: false,
        costCenterId: costCenter.id,
        departmentCode: costCenter.departmentCode,
        currentSpendPaise: Number(costCenter.currentSpendPaise),
        monthlyBudgetLimitPaise: Number(costCenter.monthlyBudgetLimitPaise),
        remainingBudgetPaise: Math.max(0, Number(costCenter.monthlyBudgetLimitPaise) - Number(costCenter.currentSpendPaise)),
        rejectionReason: 'Department monthly travel budget quota exceeded',
      };
    }

    costCenter.currentSpendPaise = projectedSpend;
    await this.costCenterRepo.save(costCenter);

    return {
      isApproved: true,
      costCenterId: costCenter.id,
      departmentCode: costCenter.departmentCode,
      currentSpendPaise: projectedSpend,
      monthlyBudgetLimitPaise: Number(costCenter.monthlyBudgetLimitPaise),
      remainingBudgetPaise: Number(costCenter.monthlyBudgetLimitPaise) - projectedSpend,
      rejectionReason: null,
    };
  }
}
