import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RescueRequestDto,
  CreateRescueRequestDto,
  RescueUnitDto,
  RescueServiceType,
  RescueDispatchStatus,
} from '@ecoride/contracts';
import { RescueRequest } from '../../database/entities/rescue-request.entity';
import { RescueUnit } from '../../database/entities/rescue-unit.entity';

@Injectable()
export class EmergencyRescueService {
  constructor(
    @InjectRepository(RescueRequest)
    private readonly requestRepo: Repository<RescueRequest>,
    @InjectRepository(RescueUnit)
    private readonly unitRepo: Repository<RescueUnit>,
  ) {}

  /**
   * Dispatches an emergency mobile rescue van or flatbed tow
   */
  async requestRescue(dto: CreateRescueRequestDto): Promise<RescueRequestDto> {
    if (dto.currentSocPercent > 35.0) {
      throw new BadRequestException('Rescue dispatch is reserved for depleted or stranded EVs (SoC <= 35%)');
    }

    // Find nearest available rescue unit
    const availableUnits = await this.unitRepo.find({ where: { isAvailable: true } });
    const assignedUnit = availableUnits.length > 0 ? availableUnits[0] : null;

    const baseFeePaise = dto.serviceType === RescueServiceType.MOBILE_DC_FAST_BOOST ? 35000 : 50000;
    const gstPaise = Math.round(baseFeePaise * 0.18); // 18% SAC 9987
    const totalAmountPaise = baseFeePaise + gstPaise;

    const ticketNumber = `RESCUE-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const entity = this.requestRepo.create({
      ticketNumber,
      vehicleId: dto.vehicleId,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      captainId: dto.captainId,
      serviceType: dto.serviceType,
      latitude: dto.latitude,
      longitude: dto.longitude,
      landmark: dto.landmark,
      currentSocPercent: dto.currentSocPercent,
      status: assignedUnit ? RescueDispatchStatus.DISPATCHED : RescueDispatchStatus.REQUESTED,
      assignedRescueUnitId: assignedUnit?.id || null,
      estimatedArrivalMinutes: assignedUnit ? 18 : null,
      feePaise: baseFeePaise,
      gstPaise,
      totalAmountPaise,
    });

    const saved = await this.requestRepo.save(entity);

    if (assignedUnit) {
      assignedUnit.isAvailable = false;
      await this.unitRepo.save(assignedUnit);
    }

    return this.mapToDto(saved);
  }

  async completeRescue(ticketNumber: string): Promise<RescueRequestDto> {
    const request = await this.requestRepo.findOne({ where: { ticketNumber } });
    if (!request) {
      throw new NotFoundException(`Rescue ticket ${ticketNumber} not found`);
    }

    request.status = RescueDispatchStatus.COMPLETED;
    request.completedAt = new Date();
    const saved = await this.requestRepo.save(request);

    if (request.assignedRescueUnitId) {
      const unit = await this.unitRepo.findOne({ where: { id: request.assignedRescueUnitId } });
      if (unit) {
        unit.isAvailable = true;
        await this.unitRepo.save(unit);
      }
    }

    return this.mapToDto(saved);
  }

  async getActiveUnits(): Promise<RescueUnitDto[]> {
    const units = await this.unitRepo.find();
    return units.map((u) => ({
      id: u.id,
      unitCode: u.unitCode,
      operatorName: u.operatorName,
      mobileChargerCapacityKw: Number(u.mobileChargerCapacityKw),
      currentBatterySocPercent: Number(u.currentBatterySocPercent),
      currentLatitude: Number(u.currentLatitude),
      currentLongitude: Number(u.currentLongitude),
      isAvailable: u.isAvailable,
      serviceRadiusKm: Number(u.serviceRadiusKm),
    }));
  }

  private mapToDto(entity: RescueRequest): RescueRequestDto {
    return {
      id: entity.id,
      ticketNumber: entity.ticketNumber,
      vehicleId: entity.vehicleId,
      vehicleRegistrationNumber: entity.vehicleRegistrationNumber,
      captainId: entity.captainId,
      serviceType: entity.serviceType as RescueServiceType,
      latitude: Number(entity.latitude),
      longitude: Number(entity.longitude),
      landmark: entity.landmark,
      currentSocPercent: Number(entity.currentSocPercent),
      status: entity.status as RescueDispatchStatus,
      assignedRescueUnitId: entity.assignedRescueUnitId || undefined,
      estimatedArrivalMinutes: entity.estimatedArrivalMinutes || undefined,
      feePaise: entity.feePaise,
      gstPaise: entity.gstPaise,
      totalAmountPaise: entity.totalAmountPaise,
      createdAt: entity.createdAt.toISOString(),
      completedAt: entity.completedAt?.toISOString(),
    };
  }
}

