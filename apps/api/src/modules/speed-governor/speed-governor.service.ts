import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SpeedLimitZoneDto,
  IngestSpeedTelemetryDto,
  SpeedViolationIncidentDto,
  SpeedZoneType,
} from '@ecoride/contracts';
import { SpeedLimitZone } from '../../database/entities/speed-limit-zone.entity';
import { SpeedViolationIncident } from '../../database/entities/speed-violation-incident.entity';

@Injectable()
export class SpeedGovernorService {
  constructor(
    @InjectRepository(SpeedLimitZone)
    private readonly zoneRepo: Repository<SpeedLimitZone>,
    @InjectRepository(SpeedViolationIncident)
    private readonly incidentRepo: Repository<SpeedViolationIncident>,
  ) {}

  private readonly initialZones: Partial<SpeedLimitZone>[] = [
    {
      zoneCode: 'VJA_SCHOOL_ZONE_01',
      zoneName: 'MG Road Delhi Public School Zone',
      city: 'Vijayawada',
      zoneType: SpeedZoneType.SCHOOL_ZONE,
      maxSpeedKmph: 25,
      latitude: 16.502,
      longitude: 80.641,
      radiusMeters: 400,
    },
    {
      zoneCode: 'GNT_HOSPITAL_ZONE_01',
      zoneName: 'Guntur Government General Hospital Zone',
      city: 'Guntur',
      zoneType: SpeedZoneType.HOSPITAL_ZONE,
      maxSpeedKmph: 30,
      latitude: 16.305,
      longitude: 80.443,
      radiusMeters: 500,
    },
  ];

  async getSpeedZones(): Promise<SpeedLimitZoneDto[]> {
    let zones = await this.zoneRepo.find();
    if (zones.length === 0) {
      for (const z of this.initialZones) {
        await this.zoneRepo.save(this.zoneRepo.create(z));
      }
      zones = await this.zoneRepo.find();
    }

    return zones.map((z) => ({
      id: z.id,
      zoneCode: z.zoneCode,
      zoneName: z.zoneName,
      city: z.city,
      zoneType: z.zoneType as SpeedZoneType,
      maxSpeedKmph: z.maxSpeedKmph,
      latitude: Number(z.latitude),
      longitude: Number(z.longitude),
      radiusMeters: z.radiusMeters,
    }));
  }

  async processSpeedTelemetry(dto: IngestSpeedTelemetryDto): Promise<SpeedViolationIncidentDto | null> {
    const zones = await this.getSpeedZones();

    // Check if vehicle is within any geofenced speed zone
    for (const zone of zones) {
      const distanceMeters = this.haversineDistance(
        dto.latitude,
        dto.longitude,
        zone.latitude,
        zone.longitude,
      );

      if (distanceMeters <= zone.radiusMeters) {
        if (dto.speedKmph > zone.maxSpeedKmph + 5) {
          // 5 km/h buffer
          const excess = dto.speedKmph - zone.maxSpeedKmph;
          const penalty = excess >= 15 ? 10 : 5;

          const incident = this.incidentRepo.create({
            vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
            captainId: dto.captainId,
            zoneCode: zone.zoneCode,
            speedLimitKmph: zone.maxSpeedKmph,
            actualSpeedKmph: Math.round(dto.speedKmph),
            excessSpeedKmph: Math.round(excess),
            safetyScorePenalty: penalty,
            warningNoticeTelugu: `హెచ్చరిక: ${zone.zoneName} వద్ద వేగ పరిమితి ${zone.maxSpeedKmph} km/h దాటినది. వేగం తగ్గించండి.`,
            warningNoticeEnglish: `Speed Violation Notice: Observed speed ${Math.round(dto.speedKmph)} km/h exceeds statutory limit of ${zone.maxSpeedKmph} km/h in ${zone.zoneName}.`,
          });

          const saved = await this.incidentRepo.save(incident);

          return {
            incidentId: saved.id,
            vehicleRegistrationNumber: saved.vehicleRegistrationNumber,
            captainId: saved.captainId,
            zoneCode: saved.zoneCode,
            speedLimitKmph: saved.speedLimitKmph,
            actualSpeedKmph: saved.actualSpeedKmph,
            excessSpeedKmph: saved.excessSpeedKmph,
            safetyScorePenalty: saved.safetyScorePenalty,
            warningNoticeTelugu: saved.warningNoticeTelugu,
            warningNoticeEnglish: saved.warningNoticeEnglish,
            recordedAt: saved.recordedAt.toISOString(),
          };
        }
      }
    }

    return null;
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

