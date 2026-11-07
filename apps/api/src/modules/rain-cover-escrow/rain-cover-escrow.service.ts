import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RainCoverEscrowSessionEntity } from '../../database/entities/rain-cover-escrow-session.entity';
import {
  IssueRainCoverRequest,
  ReturnRainCoverRequest,
  RainCoverEscrowSessionRecord,
  RainCoverRentalStatus,
} from '@ecoride/contracts';

@Injectable()
export class RainCoverEscrowService {
  constructor(
    @InjectRepository(RainCoverEscrowSessionEntity)
    private readonly sessionRepo: Repository<RainCoverEscrowSessionEntity>,
  ) {}

  async issueRainCover(req: IssueRainCoverRequest): Promise<RainCoverEscrowSessionRecord> {
    if (!req.captainId || !req.vehicleId || !req.depotHubId) {
      throw new BadRequestException('captainId, vehicleId, and depotHubId are required');
    }
    if (req.depositPaise < 30000) {
      throw new BadRequestException('Security deposit must be at least ₹300 (30,000 paise)');
    }
    if (req.dailyRentalPaise <= 0) {
      throw new BadRequestException('Daily rental fee must be positive');
    }

    const session = this.sessionRepo.create({
      captainId: req.captainId,
      vehicleId: req.vehicleId,
      depotHubId: req.depotHubId,
      depositPaise: req.depositPaise,
      dailyRentalPaise: req.dailyRentalPaise,
      accumulatedRentalPaise: 0,
      refundedDepositPaise: 0,
      status: 'ISSUED',
    });

    const saved = await this.sessionRepo.save(session);

    return {
      id: saved.id,
      captainId: saved.captainId,
      vehicleId: saved.vehicleId,
      depotHubId: saved.depotHubId,
      depositPaise: Number(saved.depositPaise),
      dailyRentalPaise: Number(saved.dailyRentalPaise),
      accumulatedRentalPaise: Number(saved.accumulatedRentalPaise),
      refundedDepositPaise: Number(saved.refundedDepositPaise),
      status: saved.status as RainCoverRentalStatus,
      issuedAt: saved.issuedAt ? saved.issuedAt.toISOString() : new Date().toISOString(),
    };
  }

  async returnRainCover(req: ReturnRainCoverRequest): Promise<RainCoverEscrowSessionRecord> {
    const session = await this.sessionRepo.findOne({ where: { id: req.sessionId } });
    if (!session) {
      throw new NotFoundException(`Rain cover rental session ${req.sessionId} not found`);
    }
    if (session.status !== 'ISSUED') {
      throw new BadRequestException(`Session ${req.sessionId} is already closed with status ${session.status}`);
    }

    const now = new Date();
    const issuedTime = session.issuedAt ? new Date(session.issuedAt).getTime() : now.getTime();
    const diffHours = Math.max(1, (now.getTime() - issuedTime) / (1000 * 60 * 60));
    const rentalDays = Math.max(1, Math.ceil(diffHours / 24));

    const accumulatedRentalPaise = Number(session.dailyRentalPaise) * rentalDays;
    const damageDeductionPaise = Math.max(0, req.damageDeductionPaise);
    const totalDeductions = accumulatedRentalPaise + damageDeductionPaise;
    const refundedDepositPaise = Math.max(0, Number(session.depositPaise) - totalDeductions);

    session.accumulatedRentalPaise = accumulatedRentalPaise;
    session.refundedDepositPaise = refundedDepositPaise;
    session.returnedAt = now;
    session.status = refundedDepositPaise === 0 && damageDeductionPaise > 0 ? 'FORFEITED_DAMAGE' : 'RETURNED';

    const updated = await this.sessionRepo.save(session);

    return {
      id: updated.id,
      captainId: updated.captainId,
      vehicleId: updated.vehicleId,
      depotHubId: updated.depotHubId,
      depositPaise: Number(updated.depositPaise),
      dailyRentalPaise: Number(updated.dailyRentalPaise),
      accumulatedRentalPaise: Number(updated.accumulatedRentalPaise),
      refundedDepositPaise: Number(updated.refundedDepositPaise),
      status: updated.status as RainCoverRentalStatus,
      issuedAt: updated.issuedAt ? updated.issuedAt.toISOString() : now.toISOString(),
      returnedAt: updated.returnedAt ? updated.returnedAt.toISOString() : now.toISOString(),
    };
  }
}
