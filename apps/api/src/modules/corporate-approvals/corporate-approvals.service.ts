import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorporateRequisition } from '../../database/entities/corporate-requisition.entity';
import {
  CorporateRequisitionDto,
  ReviewCorporateRequisitionDto,
  CorporateRequisitionResult,
  CorporateApprovalStatus,
} from '@ecoride/contracts';

@Injectable()
export class CorporateApprovalsService {
  private readonly autoApprovalThresholdPaise = 50000; // ₹500.00

  constructor(
    @InjectRepository(CorporateRequisition)
    private readonly requisitionRepo: Repository<CorporateRequisition>,
  ) {}

  async createRequisition(dto: CorporateRequisitionDto): Promise<CorporateRequisitionResult> {
    const isAutoApproved = dto.estimatedFarePaise <= this.autoApprovalThresholdPaise;
    const status = isAutoApproved
      ? CorporateApprovalStatus.AUTO_APPROVED
      : CorporateApprovalStatus.PENDING_MANAGER_APPROVAL;

    const requisition = this.requisitionRepo.create({
      corporateAccountId: dto.corporateAccountId,
      departmentCode: dto.departmentCode,
      employeeUserId: dto.employeeUserId,
      managerUserId: dto.managerUserId,
      tripPurpose: dto.tripPurpose,
      estimatedFarePaise: dto.estimatedFarePaise,
      approvedFareCapPaise: isAutoApproved ? dto.estimatedFarePaise : 0,
      status,
      reviewedBy: isAutoApproved ? 'SYSTEM_AUTO_POLICY' : null,
      decisionNote: isAutoApproved
        ? 'Auto-approved: Within single-trip manager policy threshold (<= ₹500)'
        : 'Requisition submitted for manager sign-off',
    });

    const saved = await this.requisitionRepo.save(requisition);

    return {
      id: saved.id,
      corporateAccountId: saved.corporateAccountId,
      employeeUserId: saved.employeeUserId,
      status: saved.status as CorporateApprovalStatus,
      approvedFareCapPaise: saved.approvedFareCapPaise,
      departmentBudgetRemainingPaise: 45000000, // Synthetic remaining department monthly quota ₹450,000
      gstTaxInvoiceEligible: true,
      decisionNote: saved.decisionNote || undefined,
    };
  }

  async reviewRequisition(dto: ReviewCorporateRequisitionDto): Promise<CorporateRequisitionResult> {
    const req = await this.requisitionRepo.findOne({ where: { id: dto.requisitionId } });
    if (!req) {
      throw new NotFoundException(`Requisition ${dto.requisitionId} not found`);
    }

    if (req.status !== CorporateApprovalStatus.PENDING_MANAGER_APPROVAL) {
      throw new BadRequestException(`Requisition is already in status ${req.status}`);
    }

    if (dto.action === 'APPROVE') {
      req.status = CorporateApprovalStatus.APPROVED;
      req.approvedFareCapPaise = req.estimatedFarePaise;
      req.reviewedBy = dto.reviewerUserId;
      req.decisionNote = dto.comments || 'Manager approved EV corporate ride.';
    } else {
      req.status = CorporateApprovalStatus.REJECTED;
      req.approvedFareCapPaise = 0;
      req.reviewedBy = dto.reviewerUserId;
      req.decisionNote = dto.comments || 'Manager rejected travel request.';
    }

    const updated = await this.requisitionRepo.save(req);

    return {
      id: updated.id,
      corporateAccountId: updated.corporateAccountId,
      employeeUserId: updated.employeeUserId,
      status: updated.status as CorporateApprovalStatus,
      approvedFareCapPaise: updated.approvedFareCapPaise,
      departmentBudgetRemainingPaise: 45000000,
      gstTaxInvoiceEligible: updated.status === CorporateApprovalStatus.APPROVED,
      reviewedBy: updated.reviewedBy || undefined,
      decisionNote: updated.decisionNote || undefined,
    };
  }

  async getRequisition(id: string): Promise<CorporateRequisition> {
    const req = await this.requisitionRepo.findOne({ where: { id } });
    if (!req) {
      throw new NotFoundException(`Requisition ${id} not found`);
    }
    return req;
  }
}
