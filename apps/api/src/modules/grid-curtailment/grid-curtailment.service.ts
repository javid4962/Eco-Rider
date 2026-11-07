import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GridCurtailmentEvent } from '../../database/entities/grid-curtailment-event.entity';
import {
  GridFrequencyStatus,
  CurtailmentLevel,
  GridFrequencyReadingDto,
  CurtailmentInstructionResult,
} from '@ecoride/contracts';

@Injectable()
export class GridCurtailmentService {
  constructor(
    @InjectRepository(GridCurtailmentEvent)
    private readonly eventRepo: Repository<GridCurtailmentEvent>,
  ) {}

  async processGridFrequency(dto: GridFrequencyReadingDto): Promise<CurtailmentInstructionResult> {
    if (dto.gridFrequencyHz < 45 || dto.gridFrequencyHz > 55) {
      throw new BadRequestException('Grid frequency reading out of realistic physical range (45 - 55 Hz)');
    }

    let status: GridFrequencyStatus;
    let curtailmentLevel: CurtailmentLevel;
    let totalCurtailedKw = 0;
    let affectedGunCount = 0;

    if (dto.gridFrequencyHz >= 49.95) {
      status = GridFrequencyStatus.NORMAL;
      curtailmentLevel = CurtailmentLevel.NONE;
      totalCurtailedKw = 0;
      affectedGunCount = 0;
    } else if (dto.gridFrequencyHz >= 49.85) {
      status = GridFrequencyStatus.WARNING_LOW;
      curtailmentLevel = CurtailmentLevel.THROTTLE_50_PERCENT;
      totalCurtailedKw = 120;
      affectedGunCount = 8;
    } else {
      status = GridFrequencyStatus.CRITICAL_UNDER_FREQUENCY;
      curtailmentLevel = CurtailmentLevel.SHUTDOWN_NON_ESSENTIAL;
      totalCurtailedKw = 240;
      affectedGunCount = 16;
    }

    // Rate: ₹3.50/kW per hour = 350 paise/kW/hr
    const ancillaryCreditPaisePerHour = Math.round(totalCurtailedKw * 350);

    const event = this.eventRepo.create({
      substationId: dto.substationId,
      gridFrequencyHz: dto.gridFrequencyHz,
      status,
      curtailmentLevel,
      totalCurtailedKw,
      ancillaryCreditPaise: ancillaryCreditPaisePerHour,
      affectedGunCount,
    });

    const saved = await this.eventRepo.save(event);

    return {
      readingId: saved.id,
      gridFrequencyHz: Number(saved.gridFrequencyHz),
      status: saved.status,
      curtailmentLevel: saved.curtailmentLevel,
      totalCurtailedKw: Number(saved.totalCurtailedKw),
      ancillaryCreditPaisePerHour: Number(saved.ancillaryCreditPaise),
      affectedGunCount: saved.affectedGunCount,
      curtailedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
