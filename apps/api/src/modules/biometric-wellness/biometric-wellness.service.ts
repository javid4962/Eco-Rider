import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CaptainWellnessScreeningDto,
  RecordWellnessCheckDto,
  PreFlightScreeningStatus,
} from '@ecoride/contracts';
import { CaptainWellnessScreening } from '../../database/entities/captain-wellness-screening.entity';

@Injectable()
export class BiometricWellnessService {
  constructor(
    @InjectRepository(CaptainWellnessScreening)
    private readonly screeningRepo: Repository<CaptainWellnessScreening>,
  ) {}

  async recordScreening(dto: RecordWellnessCheckDto): Promise<CaptainWellnessScreeningDto> {
    if (!dto.captainId || !dto.depotId) {
      throw new BadRequestException('Captain ID and Depot ID are required for pre-flight screening');
    }

    let status = PreFlightScreeningStatus.PASSED;
    let fitForDuty = true;

    // Strict zero-tolerance for alcohol
    if (dto.bloodAlcoholContentMgDl > 0.0) {
      status = PreFlightScreeningStatus.FAILED_ALCOHOL;
      fitForDuty = false;
    } else if (
      dto.pulseOximeterSpO2Percent < 95 ||
      dto.heartRateBpm < 50 ||
      dto.heartRateBpm > 115 ||
      dto.bodyTemperatureCelsius < 35.8 ||
      dto.bodyTemperatureCelsius > 38.0
    ) {
      status = PreFlightScreeningStatus.FAILED_VITALS;
      fitForDuty = false;
    }

    const screeningId = `SCR-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const screening = this.screeningRepo.create({
      screeningId,
      captainId: dto.captainId,
      depotId: dto.depotId,
      bloodAlcoholContentMgDl: dto.bloodAlcoholContentMgDl,
      pulseOximeterSpO2Percent: dto.pulseOximeterSpO2Percent,
      heartRateBpm: dto.heartRateBpm,
      bodyTemperatureCelsius: dto.bodyTemperatureCelsius,
      status,
      fitForDuty,
    });

    const saved = await this.screeningRepo.save(screening);

    return {
      screeningId: saved.screeningId,
      captainId: saved.captainId,
      depotId: saved.depotId,
      bloodAlcoholContentMgDl: Number(saved.bloodAlcoholContentMgDl),
      pulseOximeterSpO2Percent: saved.pulseOximeterSpO2Percent,
      heartRateBpm: saved.heartRateBpm,
      bodyTemperatureCelsius: Number(saved.bodyTemperatureCelsius),
      status: saved.status as PreFlightScreeningStatus,
      fitForDuty: saved.fitForDuty,
      screenedAt: saved.screenedAt ? saved.screenedAt.toISOString() : new Date().toISOString(),
    };
  }
}
