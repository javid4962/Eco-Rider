import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargingHostSettlementEntity } from '../../database/entities/charging-host-settlement.entity';
import {
  CalculateChargingHostSettlementDto,
  ChargingHostSettlementStatus,
} from '@ecoride/contracts';

@Injectable()
export class ChargingHostSettlementService {
  constructor(
    @InjectRepository(ChargingHostSettlementEntity)
    private readonly settlementRepo: Repository<ChargingHostSettlementEntity>,
  ) {}

  async calculateAndCreateSettlement(
    dto: CalculateChargingHostSettlementDto,
  ): Promise<ChargingHostSettlementEntity> {
    const grossRevenue = BigInt(dto.grossRevenuePaise);
    const electricityCost = BigInt(dto.electricityCostPaise);
    const grossMargin = grossRevenue > electricityCost ? grossRevenue - electricityCost : 0n;

    const shareBps = BigInt(dto.landlordShareBps);
    const landlordGrossPayout = (grossMargin * shareBps) / 10000n;
    const gstAmount = (landlordGrossPayout * 1800n) / 10000n; // 18% GST SAC 9987
    const tdsDeduction = (landlordGrossPayout * 1000n) / 10000n; // 10% TDS
    const netLandlordDisbursal = landlordGrossPayout + gstAmount - tdsDeduction;
    const platformShare = grossMargin - landlordGrossPayout;

    const record = this.settlementRepo.create({
      stationId: dto.stationId,
      landlordId: dto.landlordId,
      landlordUpiId: dto.landlordUpiId,
      propertyLocation: dto.propertyLocation,
      billingPeriodStart: new Date(dto.billingPeriodStart),
      billingPeriodEnd: new Date(dto.billingPeriodEnd),
      totalEnergyKwh: dto.totalEnergyKwh,
      grossRevenuePaise: grossRevenue.toString(),
      electricityCostPaise: electricityCost.toString(),
      grossMarginPaise: grossMargin.toString(),
      landlordShareBps: dto.landlordShareBps,
      landlordGrossPayoutPaise: landlordGrossPayout.toString(),
      gstAmountPaise: gstAmount.toString(),
      tdsDeductionPaise: tdsDeduction.toString(),
      netLandlordDisbursalPaise: netLandlordDisbursal.toString(),
      platformSharePaise: platformShare.toString(),
      status: ChargingHostSettlementStatus.PROCESSED,
    });

    return this.settlementRepo.save(record);
  }

  async disburseSettlement(id: string): Promise<ChargingHostSettlementEntity> {
    const settlement = await this.getSettlement(id);
    settlement.status = ChargingHostSettlementStatus.DISBURSED;
    settlement.disbursedAt = new Date();
    return this.settlementRepo.save(settlement);
  }

  async getSettlement(id: string): Promise<ChargingHostSettlementEntity> {
    const record = await this.settlementRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Charging host settlement ${id} not found`);
    }
    return record;
  }
}
