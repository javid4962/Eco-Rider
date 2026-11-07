import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroMobilitySession } from '../../database/entities/micro-mobility-session.entity';
import {
  StartMicroMobilitySessionDto,
  EndMicroMobilitySessionDto,
  MicroMobilityBillingResult,
  MicroMobilitySessionStatus,
} from '@ecoride/contracts';

@Injectable()
export class MicroMobilityService {
  private readonly minWalletThresholdPaise = 5000; // ₹50.00
  private readonly baseUnlockFeePaise = 1000; // ₹10.00
  private readonly perMinuteFeePaise = 200; // ₹2.00/min

  constructor(
    @InjectRepository(MicroMobilitySession)
    private readonly sessionRepo: Repository<MicroMobilitySession>,
  ) {}

  async startSession(dto: StartMicroMobilitySessionDto): Promise<MicroMobilitySession> {
    if (dto.userWalletBalancePaise < this.minWalletThresholdPaise) {
      throw new BadRequestException(
        `Insufficient wallet balance (${dto.userWalletBalancePaise} paise); minimum ₹50 (5,000 paise) required to unlock e-kick scooter/e-cycle in Andhra Pradesh`,
      );
    }

    const session = this.sessionRepo.create({
      userId: dto.userId,
      vehicleCode: dto.vehicleCode,
      vehicleType: dto.vehicleType,
      originDockId: dto.dockStationId,
      status: MicroMobilitySessionStatus.UNLOCKED,
      baseUnlockFeePaise: this.baseUnlockFeePaise,
      perMinuteFeePaise: this.perMinuteFeePaise,
    });

    return await this.sessionRepo.save(session);
  }

  async endSession(dto: EndMicroMobilitySessionDto): Promise<MicroMobilityBillingResult> {
    const session = await this.sessionRepo.findOne({ where: { id: dto.sessionId } });
    if (!session) {
      throw new NotFoundException(`Session ${dto.sessionId} not found`);
    }

    const duration = Math.max(1, dto.durationMinutes);
    const rideFee = duration * session.perMinuteFeePaise;
    const subtotal = session.baseUnlockFeePaise + rideFee;
    // Statutory AP GST: 5% SAC 996412 for passenger transport
    const gstPaise = Math.round(subtotal * 0.05);
    const totalChargedPaise = subtotal + gstPaise;

    session.durationMinutes = duration;
    session.distanceMeters = dto.distanceMeters;
    session.destinationDockId = dto.dockStationId;
    session.gstPaise = gstPaise;
    session.totalChargedPaise = totalChargedPaise;
    session.status = MicroMobilitySessionStatus.DOCKED_COMPLETED;
    session.completedAt = new Date();

    const updated = await this.sessionRepo.save(session);

    return {
      sessionId: updated.id,
      vehicleCode: updated.vehicleCode,
      status: MicroMobilitySessionStatus.DOCKED_COMPLETED,
      durationMinutes: updated.durationMinutes,
      baseUnlockFeePaise: updated.baseUnlockFeePaise,
      perMinuteFeePaise: updated.perMinuteFeePaise,
      gstPaise: updated.gstPaise,
      totalChargedPaise: updated.totalChargedPaise,
      dockStationVerified: true,
    };
  }

  async getSession(id: string): Promise<MicroMobilitySession> {
    const s = await this.sessionRepo.findOne({ where: { id } });
    if (!s) {
      throw new NotFoundException(`Session ${id} not found`);
    }
    return s;
  }
}

