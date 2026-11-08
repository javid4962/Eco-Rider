import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpeedGovernorGeofenceLogEntity } from '../../database/entities/speed-governor-geofence-log.entity';
import {
  CheckSpeedGovernorGeofenceDto,
  UrbanZoneType,
} from '@ecoride/contracts';

@Injectable()
export class SpeedGovernorGeofenceService {
  constructor(
    @InjectRepository(SpeedGovernorGeofenceLogEntity)
    private readonly logRepo: Repository<SpeedGovernorGeofenceLogEntity>,
  ) {}

  async checkGeofence(dto: CheckSpeedGovernorGeofenceDto): Promise<SpeedGovernorGeofenceLogEntity> {
    let mandatedSpeedLimitKmph = 50.0;

    switch (dto.zoneType) {
      case UrbanZoneType.TEMPLE_PEDESTRIAN_ZONE:
        mandatedSpeedLimitKmph = 20.0;
        break;
      case UrbanZoneType.SCHOOL_HOSPITAL_ZONE:
        mandatedSpeedLimitKmph = 25.0;
        break;
      case UrbanZoneType.COMMERCIAL_MARKET_CORRIDOR:
        mandatedSpeedLimitKmph = 30.0;
        break;
      case UrbanZoneType.STANDARD_ARTERIAL:
      default:
        mandatedSpeedLimitKmph = 50.0;
        break;
    }

    const isViolation = dto.currentSpeedKmph > mandatedSpeedLimitKmph;
    const throttleLimitPercent = isViolation ? 40.0 : 100.0;
    const hapticWarningIssued = isViolation;

    const record = this.logRepo.create({
      vehicleId: dto.vehicleId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      currentSpeedKmph: dto.currentSpeedKmph,
      zoneType: dto.zoneType,
      mandatedSpeedLimitKmph,
      isViolation,
      throttleLimitPercent,
      hapticWarningIssued,
      loggedAt: new Date(),
    });

    return this.logRepo.save(record);
  }

  async getLog(id: string): Promise<SpeedGovernorGeofenceLogEntity> {
    const record = await this.logRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Speed governor geofence log ${id} not found`);
    }
    return record;
  }
}
