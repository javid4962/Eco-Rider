import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { TransitTurnstileAccess } from '../../database/entities/transit-turnstile-access.entity';
import {
  TurnstileGateStatus,
  GenerateTransitQrRequestDto,
  TransitQrTokenResult,
  ValidateTurnstileScanDto,
  TurnstileScanResult,
} from '@ecoride/contracts';

@Injectable()
export class TransitTurnstileService {
  private readonly secretKey = 'ecoride-turnstile-secret-seed-key';

  constructor(
    @InjectRepository(TransitTurnstileAccess)
    private readonly turnstileRepo: Repository<TransitTurnstileAccess>,
  ) {}

  async generateTransitQr(dto: GenerateTransitQrRequestDto): Promise<TransitQrTokenResult> {
    if (!dto.bookingId || !dto.riderId || !dto.stationCode) {
      throw new BadRequestException('Booking ID, rider ID, and station code are required');
    }

    const expiresAt = new Date(Date.now() + 120 * 1000); // 120 seconds validity
    const rawPayload = `${dto.bookingId}:${dto.riderId}:${dto.stationCode}:${expiresAt.getTime()}`;
    const signature = crypto.createHmac('sha256', this.secretKey).update(rawPayload).digest('hex');
    const qrPayload = `ECORIDE:${rawPayload}:${signature.substring(0, 16)}`;
    const tokenHash = crypto.createHash('sha256').update(qrPayload).digest('hex');

    const access = this.turnstileRepo.create({
      tokenHash,
      bookingId: dto.bookingId,
      riderId: dto.riderId,
      stationCode: dto.stationCode,
      gateStatus: TurnstileGateStatus.GATE_OPEN,
      expiresAt,
    });

    await this.turnstileRepo.save(access);

    return {
      token: tokenHash,
      qrPayload,
      bookingId: dto.bookingId,
      stationCode: dto.stationCode,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async validateTurnstileScan(dto: ValidateTurnstileScanDto): Promise<TurnstileScanResult> {
    const tokenHash = crypto.createHash('sha256').update(dto.qrPayload).digest('hex');
    const record = await this.turnstileRepo.findOne({ where: { tokenHash } });

    if (!record) {
      return {
        turnstileId: dto.turnstileId,
        stationCode: dto.stationCode,
        gateStatus: TurnstileGateStatus.ACCESS_DENIED,
        actuatorSignalMs: 0,
        message: 'Invalid or unregistered transit QR token',
      };
    }

    const now = new Date(dto.scannedAt || Date.now());

    if (now > record.expiresAt) {
      record.gateStatus = TurnstileGateStatus.EXPIRED;
      await this.turnstileRepo.save(record);
      return {
        turnstileId: dto.turnstileId,
        stationCode: dto.stationCode,
        gateStatus: TurnstileGateStatus.EXPIRED,
        actuatorSignalMs: 0,
        riderId: record.riderId,
        message: 'Transit QR token has expired',
      };
    }

    if (record.scannedAt) {
      record.gateStatus = TurnstileGateStatus.ALREADY_USED;
      await this.turnstileRepo.save(record);
      return {
        turnstileId: dto.turnstileId,
        stationCode: dto.stationCode,
        gateStatus: TurnstileGateStatus.ALREADY_USED,
        actuatorSignalMs: 0,
        riderId: record.riderId,
        message: 'Transit QR token has already been scanned',
      };
    }

    if (record.stationCode !== dto.stationCode) {
      return {
        turnstileId: dto.turnstileId,
        stationCode: dto.stationCode,
        gateStatus: TurnstileGateStatus.ACCESS_DENIED,
        actuatorSignalMs: 0,
        riderId: record.riderId,
        message: 'Station mismatch for passenger pass',
      };
    }

    record.scannedAt = now;
    record.turnstileId = dto.turnstileId;
    record.gateStatus = TurnstileGateStatus.GATE_OPEN;
    await this.turnstileRepo.save(record);

    return {
      turnstileId: dto.turnstileId,
      stationCode: dto.stationCode,
      gateStatus: TurnstileGateStatus.GATE_OPEN,
      actuatorSignalMs: 5000,
      riderId: record.riderId,
      message: 'Access granted. Turnstile gate unlocked for 5 seconds.',
    };
  }
}
