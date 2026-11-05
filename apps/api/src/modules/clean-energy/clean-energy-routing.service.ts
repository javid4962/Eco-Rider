import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DepotSolarGenerationDto,
  OptimalChargingDepotRecommendationDto,
  QueryOptimalDepotDto,
} from '@ecoride/contracts';
import { DepotSolarGeneration } from '../../database/entities/depot-solar-generation.entity';

@Injectable()
export class CleanEnergyRoutingService {
  constructor(
    @InjectRepository(DepotSolarGeneration)
    private readonly solarRepo: Repository<DepotSolarGeneration>,
  ) {}

  async recordSolarTelemetry(dto: DepotSolarGenerationDto): Promise<DepotSolarGeneration> {
    const entry = this.solarRepo.create({
      depotId: dto.depotId,
      depotName: dto.depotName,
      currentSolarOutputKw: dto.currentSolarOutputKw,
      gridCarbonIntensityGCo2Kwh: dto.gridCarbonIntensityGCo2Kwh,
      greenEnergyPercentage: dto.greenEnergyPercentage,
    });

    return this.solarRepo.save(entry);
  }

  async findOptimalDepot(dto: QueryOptimalDepotDto): Promise<OptimalChargingDepotRecommendationDto> {
    if (dto.requiredKwh <= 0) {
      throw new BadRequestException('Required kWh must be greater than zero');
    }

    const depots = await this.solarRepo.find({
      order: { recordedAt: 'DESC' },
      take: 10,
    });

    if (depots.length === 0) {
      // Default Amaravathi Core Green Hub
      const standardGridIntensity = 720;
      const solarIntensity = 50;
      const estimatedCo2SavedGrams = Math.round(dto.requiredKwh * (standardGridIntensity - solarIntensity));

      return {
        recommendedDepotId: '00000000-0000-4000-8000-000000000001',
        depotName: 'Amaravathi Capital Solar EV Depot',
        greenEnergyPercentage: 92.5,
        estimatedCo2SavedGrams,
        availableChargerGuns: 8,
        distanceKm: 4.2,
      };
    }

    // Pick depot with highest green energy percentage
    depots.sort((a, b) => Number(b.greenEnergyPercentage) - Number(a.greenEnergyPercentage));
    const best = depots[0];

    const standardGrid = 720;
    const estimatedCo2SavedGrams = Math.round(
      dto.requiredKwh * (standardGrid - best.gridCarbonIntensityGCo2Kwh),
    );

    return {
      recommendedDepotId: best.depotId,
      depotName: best.depotName,
      greenEnergyPercentage: Number(best.greenEnergyPercentage),
      estimatedCo2SavedGrams: Math.max(0, estimatedCo2SavedGrams),
      availableChargerGuns: 6,
      distanceKm: 5.5,
    };
  }
}
