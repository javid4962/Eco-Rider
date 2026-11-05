import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  EmergencyPowerMissionDto,
  DispatchEmergencyPowerDto,
  IslandingMissionStatus,
} from '@ecoride/contracts';
import { EmergencyPowerMission } from '../../database/entities/emergency-power-mission.entity';

@Injectable()
export class EmergencyIslandingService {
  constructor(
    @InjectRepository(EmergencyPowerMission)
    private readonly missionRepo: Repository<EmergencyPowerMission>,
  ) {}

  async dispatchPowerMission(dto: DispatchEmergencyPowerDto): Promise<EmergencyPowerMissionDto> {
    if (!dto.targetFacilityName || !dto.assignedFleetVehicleNumber) {
      throw new BadRequestException('Target facility name and assigned vehicle number are required');
    }

    if (dto.batteryReserveKwh < 50) {
      throw new BadRequestException(
        `Assigned vehicle battery reserve (${dto.batteryReserveKwh} kWh) insufficient for emergency islanding mission (minimum 50 kWh required)`,
      );
    }

    const missionId = `MSN-ISL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const durationHoursEstimated = Math.max(1, Math.round(dto.batteryReserveKwh / (dto.inverterCapacityKw * 0.4)));

    const mission = this.missionRepo.create({
      missionId,
      targetFacilityName: dto.targetFacilityName,
      facilityType: dto.facilityType,
      assignedFleetVehicleNumber: dto.assignedFleetVehicleNumber,
      inverterCapacityKw: dto.inverterCapacityKw,
      batteryReserveKwh: dto.batteryReserveKwh,
      durationHoursEstimated,
      status: IslandingMissionStatus.DISPATCHED,
    });

    const saved = await this.missionRepo.save(mission);
    return this.mapToDto(saved);
  }

  async completeMission(missionId: string): Promise<EmergencyPowerMissionDto> {
    const mission = await this.missionRepo.findOne({ where: { missionId } });
    if (!mission) {
      throw new NotFoundException(`Emergency power mission ${missionId} not found`);
    }

    mission.status = IslandingMissionStatus.MISSION_COMPLETED;
    const saved = await this.missionRepo.save(mission);
    return this.mapToDto(saved);
  }

  private mapToDto(m: EmergencyPowerMission): EmergencyPowerMissionDto {
    return {
      missionId: m.missionId,
      targetFacilityName: m.targetFacilityName,
      facilityType: m.facilityType as 'HOSPITAL' | 'WATER_PUMPING' | 'CYCLONE_SHELTER',
      assignedFleetVehicleNumber: m.assignedFleetVehicleNumber,
      inverterCapacityKw: m.inverterCapacityKw,
      batteryReserveKwh: m.batteryReserveKwh,
      durationHoursEstimated: m.durationHoursEstimated,
      status: m.status as IslandingMissionStatus,
      dispatchedAt: m.dispatchedAt ? m.dispatchedAt.toISOString() : new Date().toISOString(),
    };
  }
}
