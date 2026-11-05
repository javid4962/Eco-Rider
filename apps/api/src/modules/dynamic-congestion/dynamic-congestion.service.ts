import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CongestionZone } from '../../database/entities/congestion-zone.entity';
import {
  CalculateCongestionSurchargeDto,
  CongestionSurchargeResult,
} from '@ecoride/contracts';

@Injectable()
export class DynamicCongestionService {
  constructor(
    @InjectRepository(CongestionZone)
    private readonly zoneRepo: Repository<CongestionZone>,
  ) {}

  async getZoneByCode(zoneCode: string): Promise<CongestionZone> {
    const zone = await this.zoneRepo.findOne({ where: { zoneCode } });
    if (!zone) {
      throw new NotFoundException(`Congestion zone with code ${zoneCode} not found`);
    }
    return zone;
  }

  async calculateSurcharge(dto: CalculateCongestionSurchargeDto): Promise<CongestionSurchargeResult> {
    const zone = await this.getZoneByCode(dto.zoneCode);

    // Current hour in IST (UTC + 5:30)
    let currentHourIST = dto.hourIST;
    if (currentHourIST === undefined) {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const utcMinute = now.getUTCMinutes();
      currentHourIST = Math.floor((utcHour + 5 + (utcMinute + 30) / 60) % 24);
    }

    // Peak hours in Andhra Pradesh: Morning 8:00-11:00 IST, Evening 17:00-21:00 IST
    const isPeakHour =
      (currentHourIST >= 8 && currentHourIST < 11) ||
      (currentHourIST >= 17 && currentHourIST < 21);

    const isCongestionActive = zone.isActive && isPeakHour && dto.roadCongestionFactor > 1.2;

    if (!isCongestionActive) {
      return {
        zoneCode: zone.zoneCode,
        isCongestionActive: false,
        congestionMultiplier: 1.0,
        baseFeePaise: zone.baseCongestionFeePaise,
        calculatedSurchargePaise: 0,
        statutoryGstPaise: 0,
        totalSurchargeWithGstPaise: 0,
        municipalContributionPaise: 0,
      };
    }

    const multiplier = Math.min(Number(zone.maxMultiplier), dto.roadCongestionFactor);
    const calculatedSurchargePaise = Math.round(zone.baseCongestionFeePaise * multiplier);
    // Statutory AP GST: 5% for passenger transport (SAC 996412)
    const statutoryGstPaise = Math.round(calculatedSurchargePaise * 0.05);
    const totalSurchargeWithGstPaise = calculatedSurchargePaise + statutoryGstPaise;
    // 20% diverted to AP Urban Green Transit Infrastructure Fund
    const municipalContributionPaise = Math.round(calculatedSurchargePaise * 0.2);

    return {
      zoneCode: zone.zoneCode,
      isCongestionActive: true,
      congestionMultiplier: Number(multiplier.toFixed(2)),
      baseFeePaise: zone.baseCongestionFeePaise,
      calculatedSurchargePaise,
      statutoryGstPaise,
      totalSurchargeWithGstPaise,
      municipalContributionPaise,
    };
  }

  async listActiveZones(): Promise<CongestionZone[]> {
    return await this.zoneRepo.find({ where: { isActive: true } });
  }
}
