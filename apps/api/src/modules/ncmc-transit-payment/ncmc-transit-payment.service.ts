import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { NcmcTransitTransactionEntity } from '../../database/entities/ncmc-transit-transaction.entity';
import {
  NcmcPaymentInitiationRequest,
  NcmcPaymentRecord,
  NcmcCardType,
  NcmcPaymentStatus,
} from '@ecoride/contracts';

@Injectable()
export class NcmcTransitPaymentService {
  constructor(
    @InjectRepository(NcmcTransitTransactionEntity)
    private readonly txRepo: Repository<NcmcTransitTransactionEntity>,
  ) {}

  async processPayment(req: NcmcPaymentInitiationRequest): Promise<NcmcPaymentRecord> {
    if (!req.bookingId || !req.riderId || !req.cardIdentifierHash) {
      throw new BadRequestException('bookingId, riderId, and cardIdentifierHash are required');
    }
    if (req.farePaise <= 0) {
      throw new BadRequestException('farePaise must be greater than 0');
    }

    const transactionId = `NCMC-TX-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const clearinghouseBatchId = `AP-NCMC-CLEARING-${todayStr}-BZA`;

    const now = new Date();
    const tx = this.txRepo.create({
      transactionId,
      bookingId: req.bookingId,
      riderId: req.riderId,
      cardIdentifierHash: req.cardIdentifierHash,
      cardType: req.cardType,
      farePaise: req.farePaise,
      clearinghouseBatchId,
      status: 'SETTLED',
      settledAt: now,
    });

    const saved = await this.txRepo.save(tx);

    return {
      id: saved.id,
      transactionId: saved.transactionId,
      bookingId: saved.bookingId,
      riderId: saved.riderId,
      cardIdentifierHash: saved.cardIdentifierHash,
      cardType: saved.cardType as NcmcCardType,
      farePaise: Number(saved.farePaise),
      clearinghouseBatchId: saved.clearinghouseBatchId,
      status: saved.status as NcmcPaymentStatus,
      authorizedAt: saved.authorizedAt ? saved.authorizedAt.toISOString() : now.toISOString(),
      settledAt: saved.settledAt ? saved.settledAt.toISOString() : now.toISOString(),
    };
  }

  async getTransaction(transactionId: string): Promise<NcmcPaymentRecord> {
    const tx = await this.txRepo.findOne({ where: { transactionId } });
    if (!tx) {
      throw new NotFoundException(`NCMC transaction ${transactionId} not found`);
    }

    return {
      id: tx.id,
      transactionId: tx.transactionId,
      bookingId: tx.bookingId,
      riderId: tx.riderId,
      cardIdentifierHash: tx.cardIdentifierHash,
      cardType: tx.cardType as NcmcCardType,
      farePaise: Number(tx.farePaise),
      clearinghouseBatchId: tx.clearinghouseBatchId,
      status: tx.status as NcmcPaymentStatus,
      authorizedAt: tx.authorizedAt ? tx.authorizedAt.toISOString() : new Date().toISOString(),
      settledAt: tx.settledAt ? tx.settledAt.toISOString() : undefined,
    };
  }
}

