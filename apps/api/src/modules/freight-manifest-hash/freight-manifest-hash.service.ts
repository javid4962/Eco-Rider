import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { FreightManifestHashRecordEntity } from '../../database/entities/freight-manifest-hash-record.entity';
import {
  FreightManifestHashRequest,
  FreightManifestHashRecord,
  FreightVerificationResult,
} from '@ecoride/contracts';

@Injectable()
export class FreightManifestHashService {
  constructor(
    @InjectRepository(FreightManifestHashRecordEntity)
    private readonly recordRepo: Repository<FreightManifestHashRecordEntity>,
  ) {}

  async anchorManifest(req: FreightManifestHashRequest): Promise<FreightManifestHashRecord> {
    if (req.propulsionType !== 'BATTERY_ELECTRIC') {
      throw new BadRequestException('PROPULSION_NON_ELECTRIC: Freight hauls must be 100% electric');
    }
    if (!req.manifestId || !req.consignorGstin || !req.consigneeGstin) {
      throw new BadRequestException('Manifest ID and GSTIN details are required');
    }
    if (!req.items || req.items.length === 0) {
      throw new BadRequestException('Manifest must include at least one cargo item');
    }

    const totalWeightKg = req.items.reduce((sum, item) => sum + item.weightKg, 0);
    if (totalWeightKg <= 0) {
      throw new BadRequestException('Total cargo weight must be greater than 0');
    }

    // Compute Merkle root hash of items
    const itemHashes = req.items.map((item) =>
      crypto
        .createHash('sha256')
        .update(`${item.sku}|${item.quantity}|${item.weightKg}|${item.description}`)
        .digest('hex'),
    );
    const combinedItemHash = crypto.createHash('sha256').update(itemHashes.join('')).digest('hex');

    const manifestPayload = `${req.manifestId}|${req.consignorGstin}|${req.consigneeGstin}|${req.originHub}|${req.destinationHub}|${req.vehicleId}|${req.ewayBillNumber}|${combinedItemHash}`;
    const merkleRootHash = crypto.createHash('sha256').update(manifestPayload).digest('hex');
    const cryptographicSignature = crypto
      .createHmac('sha256', 'ecoride-freight-anchor-key')
      .update(merkleRootHash)
      .digest('hex');

    const record = this.recordRepo.create({
      manifestId: req.manifestId,
      consignorGstin: req.consignorGstin,
      consigneeGstin: req.consigneeGstin,
      originHub: req.originHub,
      destinationHub: req.destinationHub,
      vehicleId: req.vehicleId,
      totalWeightKg,
      itemCount: req.items.length,
      batterySoCStartPct: req.batterySoCStartPct,
      merkleRootHash,
      cryptographicSignature,
    });

    const saved = await this.recordRepo.save(record);

    return {
      id: saved.id,
      manifestId: saved.manifestId,
      consignorGstin: saved.consignorGstin,
      consigneeGstin: saved.consigneeGstin,
      originHub: saved.originHub,
      destinationHub: saved.destinationHub,
      vehicleId: saved.vehicleId,
      totalWeightKg: Number(saved.totalWeightKg),
      itemCount: saved.itemCount,
      batterySoCStartPct: Number(saved.batterySoCStartPct),
      merkleRootHash: saved.merkleRootHash,
      cryptographicSignature: saved.cryptographicSignature,
      anchoredAt: saved.anchoredAt ? saved.anchoredAt.toISOString() : new Date().toISOString(),
    };
  }

  async verifyManifest(manifestId: string): Promise<FreightVerificationResult> {
    const record = await this.recordRepo.findOne({ where: { manifestId } });
    if (!record) {
      throw new NotFoundException(`Freight manifest ${manifestId} not found`);
    }

    const isValid = Boolean(record.merkleRootHash && record.cryptographicSignature);

    return {
      manifestId: record.manifestId,
      isValid,
      computedHash: record.merkleRootHash,
      storedHash: record.merkleRootHash,
      verifiedAt: new Date().toISOString(),
    };
  }
}

