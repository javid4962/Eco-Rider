import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroMobilityPedestrianZone } from '../../database/entities/micro-mobility-pedestrian-zone.entity';
import {
  PedestrianZoneCategory,
  IngestMicroMobilityGpsDto,
  SpeedGovernorInstructionResult,
} from '@ecoride/contracts';

@Injectable()
export class MicroMobilitySpeedGovernorService {
  constructor(
    @InjectRepository(MicroMobilityPedestrianZone)
    private readonly zoneRepo: Repository<MicroMobilityPedestrianZone>,
  ) {}

  async processGpsTelemetry(dto: IngestMicroMobilityGpsDto): Promise<SpeedGovernorInstructionResult> {
    if (dto.currentSpeedKmh < 0) {
      throw new BadRequestException('Speed cannot be negative');
    }

    const zones = await this.zoneRepo.find({ where: { isActive: true } });

    let matchedZone: MicroMobilityPedestrianZone | null = null;
    for (const zone of zones) {
      if (
        dto.latitude >= Number(zone.minLatitude) &&
        dto.latitude <= Number(zone.maxLatitude) &&
        dto.longitude >= Number(zone.minLongitude) &&
        dto.longitude <= Number(zone.maxLongitude)
      ) {
        matchedZone = zone;
        break;
      }
    }

    let isInPedestrianZone = false;
    let zoneCategory = PedestrianZoneCategory.STANDARD_CYCLE_TRACK;
    let enforcedSpeedLimitKmh = 25;
    let throttleAdjustmentRequired = false;
    let audibleChimeWarning = false;

    if (matchedZone) {
      isInPedestrianZone = true;
      zoneCategory = matchedZone.category;
      enforcedSpeedLimitKmh = matchedZone.speedLimitKmh;
      if (dto.currentSpeedKmh > enforcedSpeedLimitKmh) {
        throttleAdjustmentRequired = true;
        audibleChimeWarning = true;
      }
    }

    return {
      vehicleId: dto.vehicleId,
      isInPedestrianZone,
      zoneCategory,
      enforcedSpeedLimitKmh,
      throttleAdjustmentRequired,
      audibleChimeWarning,
      timestamp: new Date().toISOString(),
    };
  }

  async createZone(zone: Partial<MicroMobilityPedestrianZone>): Promise<MicroMobilityPedestrianZone> {
    const created = this.zoneRepo.create(zone);
    return this.zoneRepo.save(created);
  }
}
