import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { CarbonCreditBatch } from '../../database/entities/carbon-credit-batch.entity';
import {
  CarbonCreditMintingBatchDto,
  MintedCarbonCreditBatchResult,
} from '@ecoride/contracts';

@Injectable()
export class CarbonCreditsService {
  constructor(
    @InjectRepository(CarbonCreditBatch)
    private readonly batchRepo: Repository<CarbonCreditBatch>,
  ) {}

  async mintCredits(dto: CarbonCreditMintingBatchDto): Promise<MintedCarbonCreditBatchResult> {
    if (dto.avoidedCo2Kg <= 0) {
      throw new BadRequestException('Avoided CO2 volume must be strictly positive');
    }

    const totalCreditsMinted = Math.floor(dto.avoidedCo2Kg / 1000);
    const fractionalKgCarriedForward = Number((dto.avoidedCo2Kg % 1000).toFixed(2));

    const tokenSerialNumbers: string[] = [];
    for (let i = 1; i <= totalCreditsMinted; i++) {
      tokenSerialNumbers.push(
        `ECO-${dto.certifyingStandard}-${dto.batchIdentifier}-${String(i).padStart(4, '0')}`,
      );
    }

    const verificationHash = crypto
      .createHash('sha256')
      .update(
        `VCM-CARBON:${dto.batchIdentifier}:${dto.totalElectricKm}:${dto.avoidedCo2Kg}:${dto.certifyingStandard}`,
      )
      .digest('hex');

    const batch = this.batchRepo.create({
      batchIdentifier: dto.batchIdentifier,
      totalCreditsMinted,
      fractionalKgCarriedForward,
      totalAvoidedCo2Kg: dto.avoidedCo2Kg,
      totalElectricKm: dto.totalElectricKm,
      certifyingStandard: dto.certifyingStandard,
      status: 'MINTED',
      verificationHash,
    });

    const saved = await this.batchRepo.save(batch);

    return {
      batchId: saved.id,
      batchIdentifier: saved.batchIdentifier,
      totalCreditsMinted: saved.totalCreditsMinted,
      fractionalKgCarriedForward: Number(saved.fractionalKgCarriedForward),
      tokenSerialNumbers,
      verificationHash: saved.verificationHash,
      mintedAt: saved.mintedAt.toISOString(),
      status: 'MINTED',
    };
  }

  async getBatch(batchIdentifier: string): Promise<CarbonCreditBatch> {
    const batch = await this.batchRepo.findOne({ where: { batchIdentifier } });
    if (!batch) {
      throw new NotFoundException(`Carbon credit batch ${batchIdentifier} not found`);
    }
    return batch;
  }
}

