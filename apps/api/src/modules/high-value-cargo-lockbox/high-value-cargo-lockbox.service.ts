import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { HighValueLockbox } from '../../database/entities/high-value-lockbox.entity';
import {
  LockboxSecurityState,
  ProvisionLockboxDto,
  LockboxProvisionResult,
  VerifyLockboxOtpDto,
  LockboxAccessResult,
} from '@ecoride/contracts';

@Injectable()
export class HighValueCargoLockboxService {
  constructor(
    @InjectRepository(HighValueLockbox)
    private readonly lockboxRepo: Repository<HighValueLockbox>,
  ) {}

  async provisionLockbox(dto: ProvisionLockboxDto): Promise<LockboxProvisionResult> {
    if (!dto.consignmentId || !dto.vehicleId) {
      throw new BadRequestException('Consignment ID and vehicle ID are required');
    }

    const depositOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const withdrawalOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const senderDepositOtpHash = crypto.createHash('sha256').update(depositOtp).digest('hex');
    const receiverWithdrawalOtpHash = crypto.createHash('sha256').update(withdrawalOtp).digest('hex');

    const lockbox = this.lockboxRepo.create({
      consignmentId: dto.consignmentId,
      vehicleId: dto.vehicleId,
      senderPhone: dto.senderPhone,
      receiverPhone: dto.receiverPhone,
      senderDepositOtpHash,
      receiverWithdrawalOtpHash,
      isHighValuePharma: dto.isHighValuePharma,
      securityState: LockboxSecurityState.SECURE_LOCKED,
    });

    const saved = await this.lockboxRepo.save(lockbox);

    return {
      lockboxId: saved.id,
      consignmentId: saved.consignmentId,
      vehicleId: saved.vehicleId,
      senderDepositOtpHash: saved.senderDepositOtpHash,
      receiverWithdrawalOtp: withdrawalOtp,
      securityState: saved.securityState,
      provisionedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  async verifyLockboxOtp(dto: VerifyLockboxOtpDto): Promise<LockboxAccessResult> {
    const lockbox = await this.lockboxRepo.findOne({ where: { id: dto.lockboxId } });
    if (!lockbox) {
      throw new NotFoundException('High-value lockbox not found');
    }

    const inputHash = crypto.createHash('sha256').update(dto.otp).digest('hex');
    const targetHash =
      dto.actorRole === 'SENDER' ? lockbox.senderDepositOtpHash : lockbox.receiverWithdrawalOtpHash;

    const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(targetHash));

    if (!isMatch) {
      return {
        lockboxId: lockbox.id,
        securityState: lockbox.securityState,
        isAccessGranted: false,
        message: 'Invalid lockbox authorization OTP. Access denied.',
        timestamp: new Date().toISOString(),
      };
    }

    if (dto.actorRole === 'RECEIVER') {
      lockbox.securityState = LockboxSecurityState.DELIVERED_CLEARED;
    } else {
      lockbox.securityState = LockboxSecurityState.UNLOCKED_ACCESS;
    }

    await this.lockboxRepo.save(lockbox);

    return {
      lockboxId: lockbox.id,
      securityState: lockbox.securityState,
      isAccessGranted: true,
      message: `${dto.actorRole} authenticated. Electronic lock released.`,
      timestamp: new Date().toISOString(),
    };
  }
}
