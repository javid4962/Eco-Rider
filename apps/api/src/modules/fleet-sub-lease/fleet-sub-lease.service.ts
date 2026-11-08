import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FleetSubLeaseSettlementEntity } from '../../database/entities/fleet-sub-lease-settlement.entity';
import {
  ProcessSubLeaseSettlementDto,
} from '@ecoride/contracts';

@Injectable()
export class FleetSubLeaseService {
  constructor(
    @InjectRepository(FleetSubLeaseSettlementEntity)
    private readonly settlementRepo: Repository<FleetSubLeaseSettlementEntity>,
  ) {}

  async processSettlement(dto: ProcessSubLeaseSettlementDto): Promise<FleetSubLeaseSettlementEntity> {
    if (dto.grossFarePaise <= dto.platformFeePaise) {
      throw new BadRequestException('Gross fare must exceed platform fee');
    }

    const netDistributablePaise = dto.grossFarePaise - dto.platformFeePaise;

    // 50% Captain, 30% Fleet Owner, 20% Battery AssetCo
    const captainSharePaise = Math.floor(netDistributablePaise * 0.50);
    const fleetOwnerSharePaise = Math.floor(netDistributablePaise * 0.30);
    const batteryAssetCoSharePaise = netDistributablePaise - (captainSharePaise + fleetOwnerSharePaise);

    const isBalanced =
      captainSharePaise + fleetOwnerSharePaise + batteryAssetCoSharePaise === netDistributablePaise;

    const record = this.settlementRepo.create({
      contractId: dto.contractId,
      vehicleId: dto.vehicleId,
      captainId: dto.captainId,
      fleetOwnerId: dto.fleetOwnerId,
      batteryAssetCoId: dto.batteryAssetCoId,
      grossFarePaise: dto.grossFarePaise,
      platformFeePaise: dto.platformFeePaise,
      netDistributablePaise,
      captainSharePaise,
      fleetOwnerSharePaise,
      batteryAssetCoSharePaise,
      isBalanced,
      settledAt: new Date(),
    });

    return this.settlementRepo.save(record);
  }

  async getSettlement(id: string): Promise<FleetSubLeaseSettlementEntity> {
    const record = await this.settlementRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Fleet sub-lease settlement ${id} not found`);
    }
    return record;
  }
}
