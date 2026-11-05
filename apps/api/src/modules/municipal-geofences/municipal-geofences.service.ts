import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MunicipalMicroGeofenceDto,
  StagingBayAllocationDto,
  CheckStagingAvailabilityDto,
  GeofenceRuleType,
} from '@ecoride/contracts';
import { MunicipalMicroGeofence } from '../../database/entities/municipal-micro-geofence.entity';

@Injectable()
export class MunicipalGeofencesService {
  constructor(
    @InjectRepository(MunicipalMicroGeofence)
    private readonly geofenceRepo: Repository<MunicipalMicroGeofence>,
  ) {}

  private readonly initialZones: Partial<MunicipalMicroGeofence>[] = [
    {
      zoneCode: 'VJA_BENZ_BAY_01',
      name: 'Benz Circle Dedicated EV Staging Bay',
      city: 'Vijayawada',
      authority: 'VMC',
      ruleType: GeofenceRuleType.MANDATORY_STAGING_BAY,
      maxStagingVehicles: 8,
      currentStagingVehicles: 3,
      boundaryCoordinates: [
        [16.506, 80.648],
        [16.508, 80.65],
      ],
      isActive: true,
    },
    {
      zoneCode: 'GNT_MIRCHI_RESTRICTED',
      name: 'Guntur Market Yard Peak Congestion Corridor',
      city: 'Guntur',
      authority: 'GMC',
      ruleType: GeofenceRuleType.NO_STOPPING_CONGESTION_ZONE,
      maxStagingVehicles: 0,
      currentStagingVehicles: 0,
      boundaryCoordinates: [
        [16.3, 80.44],
        [16.31, 80.45],
      ],
      isActive: true,
    },
  ];

  async getActiveZones(): Promise<MunicipalMicroGeofenceDto[]> {
    let zones = await this.geofenceRepo.find({ where: { isActive: true } });
    if (zones.length === 0) {
      for (const z of this.initialZones) {
        await this.geofenceRepo.save(this.geofenceRepo.create(z));
      }
      zones = await this.geofenceRepo.find({ where: { isActive: true } });
    }

    return zones.map((z) => ({
      id: z.id,
      zoneCode: z.zoneCode,
      name: z.name,
      city: z.city,
      authority: z.authority,
      ruleType: z.ruleType as GeofenceRuleType,
      maxStagingVehicles: z.maxStagingVehicles,
      currentStagingVehicles: z.currentStagingVehicles,
      boundaryCoordinates: z.boundaryCoordinates,
      isActive: z.isActive,
    }));
  }

  async allocateStagingBay(dto: CheckStagingAvailabilityDto): Promise<StagingBayAllocationDto> {
    let zone = await this.geofenceRepo.findOne({ where: { zoneCode: dto.zoneCode } });
    if (!zone) {
      const defaultZone = this.initialZones.find((z) => z.zoneCode === dto.zoneCode);
      if (!defaultZone) {
        throw new NotFoundException(`Micro-geofence zone ${dto.zoneCode} not found`);
      }
      zone = await this.geofenceRepo.save(this.geofenceRepo.create(defaultZone));
    }

    if (zone.ruleType === GeofenceRuleType.NO_STOPPING_CONGESTION_ZONE) {
      throw new BadRequestException(`Pickups and vehicle staging are prohibited in ${zone.name}`);
    }

    if (zone.currentStagingVehicles >= zone.maxStagingVehicles) {
      throw new BadRequestException(
        `Municipal staging bay is at full capacity (${zone.currentStagingVehicles}/${zone.maxStagingVehicles})`,
      );
    }

    zone.currentStagingVehicles += 1;
    await this.geofenceRepo.save(zone);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60000); // 15-minute staging window

    return {
      allocationId: `STG-${Date.now().toString(36).toUpperCase()}`,
      zoneCode: zone.zoneCode,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      captainId: dto.captainId,
      assignedBayNumber: zone.currentStagingVehicles,
      allocatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }
}

