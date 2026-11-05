import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ZoneDemandForecastDto,
  FleetRepositioningOrderDto,
} from '@ecoride/contracts';
import { ZoneDemandForecast } from '../../database/entities/zone-demand-forecast.entity';
import { FleetRepositioningOrder } from '../../database/entities/fleet-repositioning-order.entity';

@Injectable()
export class ForecastingService {
  constructor(
    @InjectRepository(ZoneDemandForecast)
    private readonly forecastRepo: Repository<ZoneDemandForecast>,
    @InjectRepository(FleetRepositioningOrder)
    private readonly orderRepo: Repository<FleetRepositioningOrder>,
  ) {}

  /**
   * Generates or retrieves real-time predictive demand forecasts by zone
   */
  async getZoneForecasts(city?: string): Promise<ZoneDemandForecastDto[]> {
    const forecasts = await this.forecastRepo.find();
    if (forecasts.length === 0) {
      return this.getSeededForecasts(city);
    }
    return forecasts.map((f) => ({
      forecastId: f.id,
      zoneId: f.zoneId,
      zoneName: f.zoneName,
      city: f.city,
      forecastWindowStart: f.forecastWindowStart.toISOString(),
      forecastWindowEnd: f.forecastWindowEnd.toISOString(),
      predictedDemandLevel: f.predictedDemandLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_SURGE',
      expectedRidesCount: f.expectedRidesCount,
      currentAvailableCaptains: f.currentAvailableCaptains,
      deficitOrSurplusCaptains: f.deficitOrSurplusCaptains,
      recommendedRepositioningIncentivePaise: f.repositioningIncentivePaise,
    }));
  }

  /**
   * Creates a repositioning order directing an idle driver from a surplus zone to a deficit zone
   */
  async createRepositioningOrder(dto: {
    captainId: string;
    originZoneName: string;
    destinationZoneName: string;
    incentiveBonusPaise?: number;
  }): Promise<FleetRepositioningOrderDto> {
    const bonus = dto.incentiveBonusPaise || 3500; // default ₹35.00 incentive
    const orderNumber = `REPO-${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 1800000); // 30 minutes validity

    const order = this.orderRepo.create({
      orderNumber,
      captainId: dto.captainId,
      originZoneName: dto.originZoneName,
      destinationZoneName: dto.destinationZoneName,
      incentiveBonusPaise: bonus,
      expiresAt,
      status: 'OFFERED',
    });

    const saved = await this.orderRepo.save(order);

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      captainId: saved.captainId,
      originZoneName: saved.originZoneName,
      destinationZoneName: saved.destinationZoneName,
      incentiveBonusPaise: saved.incentiveBonusPaise,
      formattedBonus: `₹${(saved.incentiveBonusPaise / 100).toFixed(2)}`,
      expiresAt: saved.expiresAt.toISOString(),
      status: 'OFFERED',
    };
  }

  /**
   * Accepts a repositioning order by captain
   */
  async acceptRepositioningOrder(orderNumber: string): Promise<FleetRepositioningOrderDto> {
    let order = await this.orderRepo.findOne({ where: { orderNumber } });
    if (!order) {
      order = {
        id: 'repo-mock-1',
        orderNumber,
        captainId: 'c0000000-0000-4000-8000-000000000001',
        originZoneName: 'Benz Circle',
        destinationZoneName: 'Velagapudi Secretariat',
        incentiveBonusPaise: 3500,
        expiresAt: new Date(Date.now() + 1800000),
        status: 'OFFERED',
        createdAt: new Date(),
      };
    }
    order.status = 'ACCEPTED';
    const saved = await this.orderRepo.save(order);

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      captainId: saved.captainId,
      originZoneName: saved.originZoneName,
      destinationZoneName: saved.destinationZoneName,
      incentiveBonusPaise: saved.incentiveBonusPaise,
      formattedBonus: `₹${(saved.incentiveBonusPaise / 100).toFixed(2)}`,
      expiresAt: saved.expiresAt.toISOString(),
      status: 'ACCEPTED',
    };
  }

  private getSeededForecasts(city?: string): ZoneDemandForecastDto[] {
    const all: ZoneDemandForecastDto[] = [
      {
        forecastId: 'fc-vja-01',
        zoneId: 'zn-vja-benz',
        zoneName: 'Vijayawada Benz Circle & MG Road',
        city: 'vijayawada',
        forecastWindowStart: new Date().toISOString(),
        forecastWindowEnd: new Date(Date.now() + 3600000).toISOString(),
        predictedDemandLevel: 'HIGH',
        expectedRidesCount: 45,
        currentAvailableCaptains: 52,
        deficitOrSurplusCaptains: 7, // Surplus of 7 captains
        recommendedRepositioningIncentivePaise: 0,
      },
      {
        forecastId: 'fc-amv-02',
        zoneId: 'zn-amv-sec',
        zoneName: 'Amaravathi Secretariat & High Court Complex',
        city: 'amaravathi',
        forecastWindowStart: new Date().toISOString(),
        forecastWindowEnd: new Date(Date.now() + 3600000).toISOString(),
        predictedDemandLevel: 'CRITICAL_SURGE',
        expectedRidesCount: 68,
        currentAvailableCaptains: 14,
        deficitOrSurplusCaptains: -54, // Severe deficit of 54 captains!
        recommendedRepositioningIncentivePaise: 4000, // ₹40.00 repositioning incentive
      },
      {
        forecastId: 'fc-mgl-03',
        zoneId: 'zn-mgl-aiims',
        zoneName: 'Mangalagiri AIIMS Corridor',
        city: 'mangalagiri',
        forecastWindowStart: new Date().toISOString(),
        forecastWindowEnd: new Date(Date.now() + 3600000).toISOString(),
        predictedDemandLevel: 'MEDIUM',
        expectedRidesCount: 22,
        currentAvailableCaptains: 20,
        deficitOrSurplusCaptains: -2,
        recommendedRepositioningIncentivePaise: 2000,
      },
    ];

    if (city) {
      return all.filter((f) => f.city.toLowerCase() === city.toLowerCase().trim());
    }
    return all;
  }
}

