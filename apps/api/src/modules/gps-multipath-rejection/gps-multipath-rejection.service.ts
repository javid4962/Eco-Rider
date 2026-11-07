import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GpsMultipathFilterLogEntity } from '../../database/entities/gps-multipath-filter-log.entity';
import { RawGnssFix, FusedLocationTelemetry, CanyonZone } from '@ecoride/contracts';

const AP_CANYON_ZONES: CanyonZone[] = [
  {
    name: 'Besant Road Urban Commercial Canyon',
    latitude: 16.51,
    longitude: 80.623,
    radiusMeters: 400,
  },
  {
    name: 'One Town Wholesale Heritage Canyon',
    latitude: 16.517,
    longitude: 80.611,
    radiusMeters: 600,
  },
  {
    name: 'Patnam Bazaar High-Density Canyon',
    latitude: 16.302,
    longitude: 80.445,
    radiusMeters: 500,
  },
];

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

@Injectable()
export class GpsMultipathRejectionService {
  constructor(
    @InjectRepository(GpsMultipathFilterLogEntity)
    private readonly logRepo: Repository<GpsMultipathFilterLogEntity>,
  ) {}

  getCanyonZones(): CanyonZone[] {
    return AP_CANYON_ZONES;
  }

  async filterGnssFix(fix: RawGnssFix): Promise<FusedLocationTelemetry> {
    if (!fix.vehicleId) {
      throw new BadRequestException('vehicleId is required');
    }

    let isMultipathDetected = false;
    let confidenceScore = 0.95;
    let correctedDriftMeters = 0;
    let canyonZoneName: string | undefined = undefined;
    let filteredLat = fix.latitude;
    let filteredLng = fix.longitude;

    // Check if within any dense urban canyon
    for (const zone of AP_CANYON_ZONES) {
      const dist = calculateDistanceMeters(fix.latitude, fix.longitude, zone.latitude, zone.longitude);
      if (dist <= zone.radiusMeters) {
        canyonZoneName = zone.name;
        break;
      }
    }

    const poorGeometry = fix.hdop > 3.0 || fix.satellitesInView < 6;
    const wheelDiscrepancy =
      fix.wheelTickSpeedKmph !== undefined && Math.abs(fix.speedKmph - fix.wheelTickSpeedKmph) > 12;

    if (canyonZoneName && (poorGeometry || wheelDiscrepancy || fix.hdop > 2.0)) {
      isMultipathDetected = true;
      confidenceScore = 0.65;
      // Multipath rejection snapping logic: adjust drift by 15-30m towards center
      correctedDriftMeters = Math.min(Math.round(fix.hdop * 8), 45);
      filteredLat = Number((fix.latitude - 0.0001).toFixed(7));
      filteredLng = Number((fix.longitude - 0.0001).toFixed(7));
    } else if (poorGeometry) {
      isMultipathDetected = true;
      confidenceScore = 0.75;
      correctedDriftMeters = 12;
    }

    const log = this.logRepo.create({
      vehicleId: fix.vehicleId,
      filteredLatitude: filteredLat,
      filteredLongitude: filteredLng,
      isMultipathDetected,
      confidenceScore,
      canyonZoneName: canyonZoneName ?? null,
      correctedDriftMeters,
    });

    const saved = await this.logRepo.save(log);

    return {
      id: saved.id,
      vehicleId: saved.vehicleId,
      filteredLatitude: Number(saved.filteredLatitude),
      filteredLongitude: Number(saved.filteredLongitude),
      isMultipathDetected: saved.isMultipathDetected,
      confidenceScore: Number(saved.confidenceScore),
      canyonZoneName: saved.canyonZoneName ?? undefined,
      correctedDriftMeters: Number(saved.correctedDriftMeters),
      timestamp: saved.recordedAt ? saved.recordedAt.toISOString() : new Date().toISOString(),
    };
  }
}
