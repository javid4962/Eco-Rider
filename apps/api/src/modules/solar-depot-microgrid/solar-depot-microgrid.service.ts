import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolarDepotMicrogridEventEntity } from '../../database/entities/solar-depot-microgrid-event.entity';
import { SolarDepotMicrogridReading, MicrogridPeakShavingDispatch, MicrogridPowerSource } from '@ecoride/contracts';

@Injectable()
export class SolarDepotMicrogridService {
  constructor(
    @InjectRepository(SolarDepotMicrogridEventEntity)
    private readonly eventRepo: Repository<SolarDepotMicrogridEventEntity>,
  ) {}

  async dispatchPeakShaving(reading: SolarDepotMicrogridReading): Promise<MicrogridPeakShavingDispatch> {
    if (!reading.depotId) {
      throw new BadRequestException('depotId is required');
    }
    if (reading.totalChargingLoadKw < 0 || reading.solarGenerationKw < 0) {
      throw new BadRequestException('Load and solar generation must be non-negative');
    }

    const isPeakPeriod = reading.gridDemandTariffPaisePerKwh >= 700;
    let sourceMode: MicrogridPowerSource = 'GRID';
    let peakShavedKw = 0;
    let solarBessDrawKw = 0;
    let gridDrawKw = reading.totalChargingLoadKw;

    if (isPeakPeriod && reading.depotBessSocPct >= 25) {
      // Shave peak using solar + depot BESS reserve
      const potentialRenewableKw = reading.solarGenerationKw + Math.max(0, (reading.depotBessSocPct - 20) * 2);
      solarBessDrawKw = Math.min(reading.totalChargingLoadKw, potentialRenewableKw);
      gridDrawKw = Math.max(0, reading.totalChargingLoadKw - solarBessDrawKw);
      peakShavedKw = solarBessDrawKw;

      if (gridDrawKw === 0) {
        sourceMode = 'SOLAR_BESS';
      } else {
        sourceMode = 'HYBRID';
      }
    }

    // Arbitrage savings vs baseline grid tariff (assuming solar cost is 280 paise/kWh)
    const solarBaseCostPaise = 280;
    const tariffDiffPaise = Math.max(0, reading.gridDemandTariffPaisePerKwh - solarBaseCostPaise);
    const arbitrageSavingsPaise = Math.round(peakShavedKw * tariffDiffPaise);

    const event = this.eventRepo.create({
      depotId: reading.depotId,
      sourceMode,
      gridDrawKw,
      solarBessDrawKw,
      peakShavedKw,
      arbitrageSavingsPaise,
      isPeakPeriod,
    });

    const saved = await this.eventRepo.save(event);

    return {
      id: saved.id,
      depotId: saved.depotId,
      sourceMode: saved.sourceMode as MicrogridPowerSource,
      gridDrawKw: Number(saved.gridDrawKw),
      solarBessDrawKw: Number(saved.solarBessDrawKw),
      peakShavedKw: Number(saved.peakShavedKw),
      arbitrageSavingsPaise: Number(saved.arbitrageSavingsPaise),
      isPeakPeriod: saved.isPeakPeriod,
      timestamp: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  async getDepotEvents(depotId: string): Promise<SolarDepotMicrogridEventEntity[]> {
    return this.eventRepo.find({
      where: { depotId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
