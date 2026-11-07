import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeatherGovernorEventEntity } from '../../database/entities/weather-governor-event.entity';
import { CorridorWeatherCondition, WeatherSpeedDirective } from '@ecoride/contracts';

@Injectable()
export class WeatherSpeedGovernorService {
  constructor(
    @InjectRepository(WeatherGovernorEventEntity)
    private readonly eventRepo: Repository<WeatherGovernorEventEntity>,
  ) {}

  async updateCorridorWeather(condition: CorridorWeatherCondition): Promise<WeatherSpeedDirective> {
    if (!condition.corridorId) {
      throw new BadRequestException('corridorId is required');
    }

    const standardSpeedLimitKmph = 80;
    let recommendedSpeedLimitKmph = 80;
    let governorActive = false;
    let reason = 'Normal dry weather conditions on corridor';

    if (condition.severity === 'HEAVY_MONSOON' || condition.precipitationMmPerHr > 35 || condition.visibilityMeters < 200) {
      recommendedSpeedLimitKmph = 50;
      governorActive = true;
      reason = 'Severe monsoon rain / dense fog: Speed throttled to 50 km/h for hydroplaning safety';
    } else if (condition.severity === 'MODERATE_RAIN' || condition.precipitationMmPerHr > 15 || condition.visibilityMeters < 500) {
      recommendedSpeedLimitKmph = 65;
      governorActive = true;
      reason = 'Wet road surface: Speed governed to 65 km/h';
    }

    const event = this.eventRepo.create({
      corridorId: condition.corridorId,
      severity: condition.severity,
      precipitationMmPerHr: condition.precipitationMmPerHr,
      visibilityMeters: condition.visibilityMeters,
      enforcedSpeedLimitKmph: recommendedSpeedLimitKmph,
      vehiclesNotifiedCount: 42, // Active vehicles on corridor receiving push limit
    });

    await this.eventRepo.save(event);

    return {
      corridorId: condition.corridorId,
      recommendedSpeedLimitKmph,
      standardSpeedLimitKmph,
      governorActive,
      reason,
      issuedAt: new Date().toISOString(),
    };
  }

  async getCorridorLatestEvent(corridorId: string): Promise<WeatherGovernorEventEntity | null> {
    return this.eventRepo.findOne({
      where: { corridorId },
      order: { effectiveFrom: 'DESC' },
    });
  }
}

