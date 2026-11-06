import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  LostItemCustodyDto,
  LogFoundItemDto,
  SecureInVaultDto,
  ClaimItemDto,
  CustodyStatus,
  LostItemCategory,
} from '@ecoride/contracts';
import { LostItemCustody } from '../../database/entities/lost-item-custody.entity';

@Injectable()
export class LostFoundCustodyService {
  constructor(
    @InjectRepository(LostItemCustody)
    private readonly custodyRepo: Repository<LostItemCustody>,
  ) {}

  async logFoundItem(dto: LogFoundItemDto): Promise<LostItemCustodyDto> {
    if (!dto.tripId || !dto.captainId || !dto.description) {
      throw new BadRequestException('Trip ID, Captain ID, and item description are required');
    }

    const trackingBarcode = `BC-LFT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const claimOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const claimVerificationOtpHash = crypto.createHash('sha256').update(claimOtp).digest('hex');

    const item = this.custodyRepo.create({
      trackingBarcode,
      tripId: dto.tripId,
      captainId: dto.captainId,
      itemCategory: dto.itemCategory,
      description: dto.description,
      status: CustodyStatus.LOGGED_BY_CAPTAIN,
      claimVerificationOtpHash,
    });

    const saved = await this.custodyRepo.save(item);
    return this.mapToDto(saved);
  }

  async secureInVault(dto: SecureInVaultDto): Promise<LostItemCustodyDto> {
    const item = await this.custodyRepo.findOne({ where: { trackingBarcode: dto.trackingBarcode } });
    if (!item) {
      throw new NotFoundException(`Item with tracking barcode ${dto.trackingBarcode} not found`);
    }

    item.depotId = dto.depotId;
    item.vaultLockerNumber = dto.vaultLockerNumber;
    item.status = CustodyStatus.SECURED_IN_DEPOT_VAULT;

    const saved = await this.custodyRepo.save(item);
    return this.mapToDto(saved);
  }

  async claimItem(dto: ClaimItemDto): Promise<LostItemCustodyDto> {
    const item = await this.custodyRepo.findOne({ where: { trackingBarcode: dto.trackingBarcode } });
    if (!item) {
      throw new NotFoundException(`Item with tracking barcode ${dto.trackingBarcode} not found`);
    }

    const inputHash = crypto.createHash('sha256').update(dto.claimOtp).digest('hex');
    if (item.claimVerificationOtpHash !== inputHash) {
      throw new BadRequestException('Invalid lost item claim verification OTP');
    }

    item.status = CustodyStatus.RETURNED_TO_OWNER;
    item.returnedAt = new Date();

    const saved = await this.custodyRepo.save(item);
    return this.mapToDto(saved);
  }

  private mapToDto(i: LostItemCustody): LostItemCustodyDto {
    return {
      trackingBarcode: i.trackingBarcode,
      tripId: i.tripId,
      captainId: i.captainId,
      depotId: i.depotId || undefined,
      vaultLockerNumber: i.vaultLockerNumber || undefined,
      itemCategory: i.itemCategory as LostItemCategory,
      description: i.description,
      status: i.status as CustodyStatus,
      claimVerificationOtpHash: i.claimVerificationOtpHash || undefined,
      loggedAt: i.loggedAt ? i.loggedAt.toISOString() : new Date().toISOString(),
      returnedAt: i.returnedAt ? i.returnedAt.toISOString() : undefined,
    };
  }
}

