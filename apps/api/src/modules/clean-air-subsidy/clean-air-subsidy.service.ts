import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AqiMonitoringRecord } from '../../database/entities/aqi-monitoring-record.entity';
import {
  AqiLevel,
  IngestAqiTelemetryDto,
  AqiSubsidyEvaluationResult,
  ApplyCleanAirSubsidyDto,
  CleanAirFareDiscountResult,
} from '@ecoride/contracts';

@Injectable()
export class CleanAirSubsidyService {
  constructor(
    @InjectRepository(AqiMonitoringRecord)
    private readonly aqiRepo: Repository<AqiMonitoringRecord>,
  ) {}

  async ingestAqiTelemetry(dto: IngestAqiTelemetryDto): Promise<AqiSubsidyEvaluationResult> {
    if (dto.aqiValue < 0) {
      throw new BadRequestException('AQI value cannot be negative');
    }

    let aqiLevel: AqiLevel;
    let subsidyActive = false;
    let subsidyDiscountPercent = 0;
    let maxSubsidyPaise = 0;

    if (dto.aqiValue <= 50) {
      aqiLevel = AqiLevel.GOOD;
    } else if (dto.aqiValue <= 100) {
      aqiLevel = AqiLevel.SATISFACTORY;
    } else if (dto.aqiValue <= 200) {
      aqiLevel = AqiLevel.MODERATE;
    } else if (dto.aqiValue <= 300) {
      aqiLevel = AqiLevel.POOR;
      subsidyActive = true;
      subsidyDiscountPercent = 10;
      maxSubsidyPaise = 5000;
    } else if (dto.aqiValue <= 400) {
      aqiLevel = AqiLevel.VERY_POOR;
      subsidyActive = true;
      subsidyDiscountPercent = 15;
      maxSubsidyPaise = 6000;
    } else {
      aqiLevel = AqiLevel.SEVERE;
      subsidyActive = true;
      subsidyDiscountPercent = 20;
      maxSubsidyPaise = 7500;
    }

    const record = this.aqiRepo.create({
      stationCode: dto.stationCode,
      sensorLocation: dto.sensorLocation,
      aqiValue: dto.aqiValue,
      pm25: dto.pm25,
      pm10: dto.pm10,
      aqiLevel,
      subsidyActive,
      subsidyDiscountPercent,
    });

    const saved = await this.aqiRepo.save(record);

    return {
      stationCode: saved.stationCode,
      aqiValue: saved.aqiValue,
      aqiLevel: saved.aqiLevel,
      isCleanAirSubsidyActive: saved.subsidyActive,
      subsidyDiscountPercent: saved.subsidyDiscountPercent,
      maxSubsidyPaise,
      municipalSponsor: 'Andhra Pradesh Clean Air Authority & APPCB',
    };
  }

  async applyCleanAirSubsidy(dto: ApplyCleanAirSubsidyDto): Promise<CleanAirFareDiscountResult> {
    if (dto.baseFarePaise <= 0) {
      throw new BadRequestException('Base fare must be positive');
    }

    const latest = await this.aqiRepo.findOne({
      where: { stationCode: dto.stationCode },
      order: { createdAt: 'DESC' },
    });

    if (!latest || !latest.subsidyActive) {
      return {
        quoteId: dto.quoteId,
        originalFarePaise: dto.baseFarePaise,
        discountPaise: 0,
        payableFarePaise: dto.baseFarePaise,
        municipalGrantCoveredPaise: 0,
        aqiLevel: latest ? latest.aqiLevel : AqiLevel.MODERATE,
      };
    }

    const discountAmount = Math.round((dto.baseFarePaise * latest.subsidyDiscountPercent) / 100);
    const maxDiscount = latest.aqiLevel === AqiLevel.SEVERE ? 7500 : 5000;
    const finalDiscount = Math.min(discountAmount, maxDiscount);
    const payableFare = dto.baseFarePaise - finalDiscount;

    return {
      quoteId: dto.quoteId,
      originalFarePaise: dto.baseFarePaise,
      discountPaise: finalDiscount,
      payableFarePaise: payableFare,
      municipalGrantCoveredPaise: finalDiscount,
      aqiLevel: latest.aqiLevel,
    };
  }
}
