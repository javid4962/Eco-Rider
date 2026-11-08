import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GridPeakTariffLogEntity } from '../../database/entities/grid-peak-tariff-log.entity';
import {
  EvaluateGridPeakTariffDto,
  GridTariffPeriod,
} from '@ecoride/contracts';

@Injectable()
export class GridPeakTariffService {
  constructor(
    @InjectRepository(GridPeakTariffLogEntity)
    private readonly logRepo: Repository<GridPeakTariffLogEntity>,
  ) {}

  async evaluateTariff(dto: EvaluateGridPeakTariffDto): Promise<GridPeakTariffLogEntity> {
    let tariffPeriod: GridTariffPeriod = GridTariffPeriod.STANDARD;
    let peakSurchargePaisePerKwh = 0;
    let corridorSurgeMultiplier = 1.0;
    let isPeakSurgeActive = false;
    let throttleAdvisory = 'Normal operation. Full charger capacity authorized.';

    const hour = dto.currentHourOfDay;

    if (hour >= 18 && hour < 22) {
      tariffPeriod = GridTariffPeriod.PEAK_SURGE;
      peakSurchargePaisePerKwh = 250; // +₹2.50/kWh peak demand penalty
      corridorSurgeMultiplier = 1.35;
      isPeakSurgeActive = true;
      if (dto.activeChargerDrawKw > 500) {
        throttleAdvisory = 'CRITICAL_GRID_PEAK: Modulate depot DC fast chargers to 70% duty cycle.';
      } else {
        throttleAdvisory = 'PEAK_SURGE_ACTIVE: Direct non-urgent fleets to battery swap or stationary BESS.';
      }
    } else if (hour >= 11 && hour < 16) {
      tariffPeriod = GridTariffPeriod.SOLAR_SUPER_OFF_PEAK;
      peakSurchargePaisePerKwh = -150; // -₹1.50/kWh solar surplus incentive
      corridorSurgeMultiplier = 1.0;
      throttleAdvisory = 'SOLAR_WINDOW: Maximize grid import and battery bank charging.';
    } else if (hour >= 22 || hour < 6) {
      tariffPeriod = GridTariffPeriod.OFF_PEAK;
      peakSurchargePaisePerKwh = -100;
      corridorSurgeMultiplier = 1.0;
      throttleAdvisory = 'NIGHT_OFF_PEAK: Standard baseline depot overnight charging active.';
    }

    const effectiveRatePaisePerKwh = Math.max(
      100,
      dto.baseTariffPaisePerKwh + peakSurchargePaisePerKwh,
    );

    const record = this.logRepo.create({
      depotId: dto.depotId,
      discom: dto.discom,
      currentHourOfDay: dto.currentHourOfDay,
      activeChargerDrawKw: dto.activeChargerDrawKw,
      baseTariffPaisePerKwh: dto.baseTariffPaisePerKwh,
      effectiveRatePaisePerKwh,
      peakSurchargePaisePerKwh,
      corridorSurgeMultiplier,
      tariffPeriod,
      isPeakSurgeActive,
      throttleAdvisory,
      evaluatedAt: new Date(),
    });

    return this.logRepo.save(record);
  }

  async getLog(id: string): Promise<GridPeakTariffLogEntity> {
    const record = await this.logRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Grid peak tariff log ${id} not found`);
    }
    return record;
  }
}
