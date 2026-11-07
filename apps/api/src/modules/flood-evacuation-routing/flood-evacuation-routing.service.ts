import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FloodEvacuationAlertEntity } from '../../database/entities/flood-evacuation-alert.entity';
import {
  FloodEvacuationRiskSeverity,
  IngestFloodSensorDto,
} from '@ecoride/contracts';

@Injectable()
export class FloodEvacuationRoutingService {
  constructor(
    @InjectRepository(FloodEvacuationAlertEntity)
    private readonly alertRepo: Repository<FloodEvacuationAlertEntity>,
  ) {}

  async ingestFloodSensor(dto: IngestFloodSensorDto): Promise<FloodEvacuationAlertEntity> {
    let severity = FloodEvacuationRiskSeverity.NORMAL;
    let rerouteActiveTrips = false;
    let evacuationHubName: string | undefined = undefined;
    let evacuationHubLat: number | undefined = undefined;
    let evacuationHubLng: number | undefined = undefined;
    let activeVehiclesNotifiedCount = 0;

    if (dto.waterDepthMm >= 400.0) {
      severity = FloodEvacuationRiskSeverity.EVACUATION_MANDATORY;
      rerouteActiveTrips = true;
      evacuationHubName = 'Indira Gandhi Municipal Stadium High Ground Hub, Vijayawada';
      evacuationHubLat = 16.5062;
      evacuationHubLng = 80.648;
      activeVehiclesNotifiedCount = 45;
    } else if (dto.waterDepthMm >= 250.0) {
      severity = FloodEvacuationRiskSeverity.INUNDATED_CRITICAL;
      rerouteActiveTrips = true;
      evacuationHubName = 'Prakasam Barrage North Bypass Staging Ground';
      evacuationHubLat = 16.51;
      evacuationHubLng = 80.618;
      activeVehiclesNotifiedCount = 20;
    } else if (dto.waterDepthMm >= 150.0) {
      severity = FloodEvacuationRiskSeverity.WATERLOGGED_PASSABLE;
      rerouteActiveTrips = false;
      activeVehiclesNotifiedCount = 8;
    }

    const alert = this.alertRepo.create({
      sensorLocation: dto.sensorLocation,
      canalOrWaterBody: dto.canalOrWaterBody,
      zone: dto.zone,
      waterDepthMm: dto.waterDepthMm,
      criticalThresholdMm: 200.0,
      flowVelocityMps: dto.flowVelocityMps,
      severity,
      rerouteActiveTrips,
      evacuationHubName,
      evacuationHubLat,
      evacuationHubLng,
      activeVehiclesNotifiedCount,
    });

    return this.alertRepo.save(alert);
  }

  async getAlert(id: string): Promise<FloodEvacuationAlertEntity> {
    const record = await this.alertRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Flood evacuation alert ${id} not found`);
    }
    return record;
  }
}
