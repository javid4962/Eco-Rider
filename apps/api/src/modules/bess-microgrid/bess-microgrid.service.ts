import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotBessUnit } from '../../database/entities/depot-bess-unit.entity';
import {
  BessTelemetryDto,
  BessDispatchDecisionResult,
  BessOperatingMode,
} from '@ecoride/contracts';

@Injectable()
export class BessMicrogridService {
  constructor(
    @InjectRepository(DepotBessUnit)
    private readonly bessRepo: Repository<DepotBessUnit>,
  ) {}

  async processTelemetry(dto: BessTelemetryDto): Promise<BessDispatchDecisionResult> {
    let mode: BessOperatingMode;
    let targetPowerKw = 0;
    let peakShavingReliefKw = 0;
    let estimatedCostSavingsPaise = 0;
    let reason: string;

    if (dto.solarInputKw >= 50.0 && dto.currentSocPercent < 95.0) {
      mode = BessOperatingMode.SOLAR_CHARGING;
      targetPowerKw = Math.min(dto.solarInputKw, 100.0);
      reason = `Abundant solar generation (${dto.solarInputKw} kW). Directing surplus solar to charge BESS storage.`;
    } else if (dto.gridPowerDemandKw >= 100.0 && dto.currentSocPercent > 20.0) {
      mode = BessOperatingMode.GRID_PEAK_DISCHARGING;
      targetPowerKw = Math.min(dto.gridPowerDemandKw * 0.5, 120.0);
      peakShavingReliefKw = targetPowerKw;
      // AP ToD tariff delta: ₹11.50 peak - ₹6.50 base = ₹5.00/kWh (500 paise/kWh)
      estimatedCostSavingsPaise = Math.round(targetPowerKw * 500);
      reason = `Depot EV charging peak demand (${dto.gridPowerDemandKw} kW). Discharging BESS to shave transformer grid peak.`;
    } else {
      mode = BessOperatingMode.IDLE_STANDBY;
      targetPowerKw = 0;
      reason = `Depot demand and solar generation within nominal balance. BESS in standby.`;
    }

    let unit = await this.bessRepo.findOne({ where: { bessUnitCode: dto.bessUnitCode } });
    if (!unit) {
      unit = this.bessRepo.create({
        depotId: dto.depotId,
        bessUnitCode: dto.bessUnitCode,
        totalCapacityKwh: dto.totalCapacityKwh,
        currentSocPercent: dto.currentSocPercent,
        chargeRateKw: mode === BessOperatingMode.SOLAR_CHARGING ? targetPowerKw : 0,
        dischargeRateKw: mode === BessOperatingMode.GRID_PEAK_DISCHARGING ? targetPowerKw : 0,
        temperatureCelsius: dto.temperatureCelsius,
        currentMode: mode,
      });
    } else {
      unit.currentSocPercent = dto.currentSocPercent;
      unit.temperatureCelsius = dto.temperatureCelsius;
      unit.chargeRateKw = mode === BessOperatingMode.SOLAR_CHARGING ? targetPowerKw : 0;
      unit.dischargeRateKw = mode === BessOperatingMode.GRID_PEAK_DISCHARGING ? targetPowerKw : 0;
      unit.currentMode = mode;
    }

    await this.bessRepo.save(unit);

    return {
      bessUnitCode: dto.bessUnitCode,
      mode,
      targetPowerKw,
      peakShavingReliefKw,
      estimatedCostSavingsPaise,
      timestamp: new Date().toISOString(),
      reason,
    };
  }

  async getBessUnit(bessUnitCode: string): Promise<DepotBessUnit> {
    const unit = await this.bessRepo.findOne({ where: { bessUnitCode } });
    if (!unit) {
      throw new NotFoundException(`BESS unit ${bessUnitCode} not found`);
    }
    return unit;
  }
}
