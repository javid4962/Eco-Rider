import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatterySecondLifeListingEntity } from '../../database/entities/battery-second-life-listing.entity';
import {
  ValueBatterySecondLifeDto,
  SecondLifeGrade,
  SecondLifeAuctionStatus,
} from '@ecoride/contracts';

@Injectable()
export class BatterySecondLifeAuctionService {
  constructor(
    @InjectRepository(BatterySecondLifeListingEntity)
    private readonly listingRepo: Repository<BatterySecondLifeListingEntity>,
  ) {}

  async valueBattery(dto: ValueBatterySecondLifeDto): Promise<BatterySecondLifeListingEntity> {
    const remainingCapacityKwh =
      Math.round(dto.originalCapacityKwh * (dto.currentSohPercent / 100) * 100) / 100;

    let grade = SecondLifeGrade.TIER_1_STATIONARY_STORAGE;
    let status = SecondLifeAuctionStatus.ASSIGNED_TO_BESS;
    let estimatedSalvageValuationPaise = Math.round(remainingCapacityKwh * 450000); // ₹4,500/kWh for Tier 1
    let recommendedStationaryBessDepot = 'AMARAVATHI_CENTRAL_DEPOT';

    if (dto.currentSohPercent >= 65) {
      grade = SecondLifeGrade.TIER_1_STATIONARY_STORAGE;
      status = SecondLifeAuctionStatus.ASSIGNED_TO_BESS;
      estimatedSalvageValuationPaise = Math.round(remainingCapacityKwh * 450000);
      recommendedStationaryBessDepot = 'AMARAVATHI_CENTRAL_DEPOT';
    } else if (dto.currentSohPercent >= 50) {
      grade = SecondLifeGrade.TIER_2_LOW_DEMAND_BACKUP;
      status = SecondLifeAuctionStatus.LISTED;
      estimatedSalvageValuationPaise = Math.round(remainingCapacityKwh * 250000); // ₹2,500/kWh
      recommendedStationaryBessDepot = 'GUNTUR_EV_SUBSTATION';
    } else {
      grade = SecondLifeGrade.RECYCLING_ONLY;
      status = SecondLifeAuctionStatus.RECYCLED;
      estimatedSalvageValuationPaise = 500000; // Flat ₹5,000 raw material recycling value
      recommendedStationaryBessDepot = 'AP_RECYCLING_PLANT_VIJAYAWADA';
    }

    const record = this.listingRepo.create({
      packSerial: dto.packSerial,
      originalCapacityKwh: dto.originalCapacityKwh,
      currentSohPercent: dto.currentSohPercent,
      cycleCount: dto.cycleCount,
      remainingCapacityKwh,
      grade,
      status,
      estimatedSalvageValuationPaise,
      recommendedStationaryBessDepot,
      evaluatedAt: new Date(),
    });

    return this.listingRepo.save(record);
  }

  async getListing(id: string): Promise<BatterySecondLifeListingEntity> {
    const record = await this.listingRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Battery second life listing ${id} not found`);
    }
    return record;
  }
}
