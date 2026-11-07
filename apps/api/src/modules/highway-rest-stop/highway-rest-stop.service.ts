import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { HighwayRestStopVoucher } from '../../database/entities/highway-rest-stop-voucher.entity';
import {
  VoucherStatus,
  IssueRestStopVoucherDto,
  RestStopVoucherResult,
  RedeemRestStopVoucherDto,
  RestStopRedemptionResult,
} from '@ecoride/contracts';

@Injectable()
export class HighwayRestStopService {
  constructor(
    @InjectRepository(HighwayRestStopVoucher)
    private readonly voucherRepo: Repository<HighwayRestStopVoucher>,
  ) {}

  async issueVoucher(dto: IssueRestStopVoucherDto): Promise<RestStopVoucherResult> {
    if (dto.voucherValuePaise < 5000 || dto.voucherValuePaise > 50000) {
      throw new BadRequestException('Voucher value must be between ₹50 (5,000 paise) and ₹500 (50,000 paise)');
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const voucherCode = `ECO-REST-${dto.location.substring(0, 4)}-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity

    const voucher = this.voucherRepo.create({
      voucherCode,
      bookingId: dto.bookingId,
      riderId: dto.riderId,
      captainId: dto.captainId,
      location: dto.location,
      valuePaise: dto.voucherValuePaise,
      status: VoucherStatus.ISSUED,
      expiresAt,
    });

    const saved = await this.voucherRepo.save(voucher);

    return {
      voucherId: saved.id,
      voucherCode: saved.voucherCode,
      bookingId: saved.bookingId,
      location: saved.location,
      valuePaise: Number(saved.valuePaise),
      status: saved.status,
      issuedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
      expiresAt: saved.expiresAt.toISOString(),
    };
  }

  async redeemVoucher(dto: RedeemRestStopVoucherDto): Promise<RestStopRedemptionResult> {
    const voucher = await this.voucherRepo.findOne({ where: { voucherCode: dto.voucherCode } });
    if (!voucher) {
      throw new NotFoundException('Rest stop voucher not found');
    }

    if (voucher.status !== VoucherStatus.ISSUED) {
      throw new BadRequestException(`Voucher cannot be redeemed: current status is ${voucher.status}`);
    }

    const now = new Date();
    if (now > voucher.expiresAt) {
      voucher.status = VoucherStatus.EXPIRED;
      await this.voucherRepo.save(voucher);
      throw new BadRequestException('Voucher has expired');
    }

    voucher.status = VoucherStatus.REDEEMED;
    voucher.merchantId = dto.merchantId;
    voucher.redeemedAt = now;
    const updated = await this.voucherRepo.save(voucher);

    return {
      voucherId: updated.id,
      voucherCode: updated.voucherCode,
      merchantId: dto.merchantId,
      settledAmountPaise: Number(updated.valuePaise),
      redeemedAt: now.toISOString(),
      ledgerRef: `LEDGER_REST_STOP_SETTLE_${updated.id}`,
    };
  }
}

