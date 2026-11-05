import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TransitSmartCardDto,
  NfcTapValidationDto,
  NfcTapResultDto,
  NfcCardType,
} from '@ecoride/contracts';
import { TransitSmartCard } from '../../database/entities/transit-smart-card.entity';
import { NfcTapTransaction } from '../../database/entities/nfc-tap-transaction.entity';

@Injectable()
export class TransitNfcService {
  constructor(
    @InjectRepository(TransitSmartCard)
    private readonly cardRepo: Repository<TransitSmartCard>,
    @InjectRepository(NfcTapTransaction)
    private readonly tapRepo: Repository<NfcTapTransaction>,
  ) {}

  async registerCard(userId: string, cardUidHash: string, cardType: NfcCardType): Promise<TransitSmartCardDto> {
    const existing = await this.cardRepo.findOne({ where: { cardUidHash } });
    if (existing) {
      return this.mapToDto(existing);
    }

    const card = this.cardRepo.create({
      cardUidHash,
      userId,
      cardType,
      linkedWalletBalancePaise: 25000, // ₹250.00 initial linked balance
      isActive: true,
    });

    const saved = await this.cardRepo.save(card);
    return this.mapToDto(saved);
  }

  async processNfcTap(dto: NfcTapValidationDto): Promise<NfcTapResultDto> {
    const card = await this.cardRepo.findOne({ where: { cardUidHash: dto.cardUidHash, isActive: true } });
    if (!card) {
      throw new NotFoundException(`NFC Smart Card ${dto.cardUidHash} not recognized or inactive`);
    }

    if (card.linkedWalletBalancePaise < dto.fareDeductionPaise) {
      return {
        transactionId: `FAIL-${Date.now().toString(36).toUpperCase()}`,
        cardUidHash: card.cardUidHash,
        stationCode: dto.stationCode,
        fareDeductedPaise: 0,
        remainingBalancePaise: card.linkedWalletBalancePaise,
        gateOpened: false,
        tappedAt: new Date().toISOString(),
      };
    }

    card.linkedWalletBalancePaise -= dto.fareDeductionPaise;
    card.lastTapStationCode = dto.stationCode;
    await this.cardRepo.save(card);

    const transaction = this.tapRepo.create({
      cardUidHash: card.cardUidHash,
      stationCode: dto.stationCode,
      fareDeductedPaise: dto.fareDeductionPaise,
      remainingBalancePaise: card.linkedWalletBalancePaise,
      gateOpened: true,
    });
    const savedTx = await this.tapRepo.save(transaction);

    return {
      transactionId: savedTx.id,
      cardUidHash: card.cardUidHash,
      stationCode: dto.stationCode,
      fareDeductedPaise: dto.fareDeductionPaise,
      remainingBalancePaise: card.linkedWalletBalancePaise,
      gateOpened: true,
      tappedAt: savedTx.tappedAt.toISOString(),
    };
  }

  private mapToDto(c: TransitSmartCard): TransitSmartCardDto {
    return {
      id: c.id,
      cardUidHash: c.cardUidHash,
      userId: c.userId,
      cardType: c.cardType as NfcCardType,
      linkedWalletBalancePaise: c.linkedWalletBalancePaise,
      lastTapStationCode: c.lastTapStationCode || undefined,
      isActive: c.isActive,
      issuedAt: c.issuedAt.toISOString(),
    };
  }
}

