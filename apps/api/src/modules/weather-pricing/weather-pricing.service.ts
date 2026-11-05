import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WeatherConditionDto,
  WeatherAdaptiveFareResultDto,
  ApWeatherAlertSeverity,
  WeatherEventType,
} from '@ecoride/contracts';
import { WeatherConditionLog } from '../../database/entities/weather-condition-log.entity';

@Injectable()
export class WeatherPricingService {
  constructor(
    @InjectRepository(WeatherConditionLog)
    private readonly weatherRepo: Repository<WeatherConditionLog>,
  ) {}

  async getCurrentWeather(zone: string, city = 'Vijayawada'): Promise<WeatherConditionDto> {
    const latest = await this.weatherRepo.findOne({
      where: { zone, city },
      order: { recordedAt: 'DESC' },
    });

    if (!latest) {
      return {
        zone,
        city,
        eventType: WeatherEventType.CLEAR,
        severity: ApWeatherAlertSeverity.NORMAL,
        ambientTemperatureCelsius: 34.0,
        precipitationMmPerHour: 0,
        windSpeedKmph: 12.0,
        isWeatherHardshipActive: false,
        driverAllowanceMultiplier: 1.0,
      };
    }

    return {
      zone: latest.zone,
      city: latest.city,
      eventType: latest.eventType as WeatherEventType,
      severity: latest.severity as ApWeatherAlertSeverity,
      ambientTemperatureCelsius: Number(latest.ambientTemperatureCelsius),
      precipitationMmPerHour: Number(latest.precipitationMmPerHour),
      windSpeedKmph: Number(latest.windSpeedKmph),
      isWeatherHardshipActive: latest.isWeatherHardshipActive,
      driverAllowanceMultiplier: Number(latest.driverAllowanceMultiplier),
    };
  }

  /**
   * Applies weather hardship pricing with 100% captain pass-through and 0% platform commission
   */
  async calculateWeatherFare(baseFarePaise: number, zone: string, city = 'Vijayawada'): Promise<WeatherAdaptiveFareResultDto> {
    const weather = await this.getCurrentWeather(zone, city);

    let hardshipMultiplier = 0.0;
    let advisoryTe = 'వాతావరణం సాధారణంగా ఉంది.';
    let advisoryEn = 'Normal weather conditions.';

    if (weather.severity === ApWeatherAlertSeverity.YELLOW_ALERT) {
      hardshipMultiplier = 0.15; // 15%
      advisoryTe = 'తీవ్రమైన ఎండ / వర్షం హెచ్చరిక: డ్రైవర్ ప్రోత్సాహకం 15% జోడించబడింది (100% డ్రైవర్ కి చేరుతుంది).';
      advisoryEn = 'Yellow Alert: 15% weather hardship allowance applied (100% paid to driver).';
    } else if (weather.severity === ApWeatherAlertSeverity.ORANGE_ALERT) {
      hardshipMultiplier = 0.30; // 30%
      advisoryTe = 'తీవ్రమైన తుఫాను / వడగాల్పులు హెచ్చరిక: డ్రైవర్ ప్రోత్సాహకం 30% జోడించబడింది.';
      advisoryEn = 'Orange Alert: 30% weather hardship allowance applied (100% paid to driver).';
    } else if (weather.severity === ApWeatherAlertSeverity.RED_ALERT) {
      hardshipMultiplier = 0.50; // 50%
      advisoryTe = 'రెడ్ అలర్ట్ అత్యవసర వాతావరణం: డ్రైవర్ ప్రోత్సాహకం 50% జోడించబడింది.';
      advisoryEn = 'IMD Red Alert: 50% emergency weather hardship allowance applied.';
    }

    const weatherHardshipSurchargePaise = Math.round(baseFarePaise * hardshipMultiplier);
    const totalPassengerFarePaise = baseFarePaise + weatherHardshipSurchargePaise;

    return {
      baseFarePaise,
      weatherHardshipSurchargePaise,
      totalPassengerFarePaise,
      captainPassThroughAllowancePaise: weatherHardshipSurchargePaise, // 100% passed through
      platformCommissionOnSurchargePaise: 0, // 0% platform commission
      alertSeverity: weather.severity,
      advisoryNoteTelugu: advisoryTe,
      advisoryNoteEnglish: advisoryEn,
    };
  }

  async recordWeatherUpdate(dto: WeatherConditionDto): Promise<void> {
    const log = this.weatherRepo.create({
      zone: dto.zone,
      city: dto.city,
      eventType: dto.eventType,
      severity: dto.severity,
      ambientTemperatureCelsius: dto.ambientTemperatureCelsius,
      precipitationMmPerHour: dto.precipitationMmPerHour,
      windSpeedKmph: dto.windSpeedKmph,
      isWeatherHardshipActive: dto.severity !== ApWeatherAlertSeverity.NORMAL,
      driverAllowanceMultiplier: dto.driverAllowanceMultiplier,
    });
    await this.weatherRepo.save(log);
  }
}

