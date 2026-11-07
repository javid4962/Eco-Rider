import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisasterMobilizationLog } from '../../database/entities/disaster-mobilization-log.entity';
import {
  DisasterMobilizationStage,
  MobilizationOrderDto,
  DisasterMobilizationStatusResult,
} from '@ecoride/contracts';

@Injectable()
export class DisasterFleetMobilizationService {
  constructor(
    @InjectRepository(DisasterMobilizationLog)
    private readonly logRepo: Repository<DisasterMobilizationLog>,
  ) {}

  async processMobilizationOrder(dto: MobilizationOrderDto): Promise<DisasterMobilizationStatusResult> {
    if (dto.requisitionFleetTargetCount < 0) {
      throw new BadRequestException('Requisition count cannot be negative');
    }

    let civilianBookingPaused = false;
    let evacuatedCitizensCount = 0;

    if (dto.mobilizationStage === DisasterMobilizationStage.ACTIVE_EVACUATION) {
      civilianBookingPaused = true;
      evacuatedCitizensCount = dto.requisitionFleetTargetCount * 4;
    } else if (dto.mobilizationStage === DisasterMobilizationStage.MEDICAL_SUPPLY_TRANSPORT) {
      civilianBookingPaused = true;
      evacuatedCitizensCount = dto.requisitionFleetTargetCount * 2;
    } else {
      civilianBookingPaused = false;
    }

    let log = await this.logRepo.findOne({ where: { incidentReference: dto.incidentReference } });

    if (!log) {
      log = this.logRepo.create({
        incidentReference: dto.incidentReference,
        commandingAgency: dto.commandingAgency,
        mobilizationStage: dto.mobilizationStage,
        civilianBookingPaused,
        totalRequisitionedVehicles: dto.requisitionFleetTargetCount,
        evacuatedCitizensCount,
      });
    } else {
      log.mobilizationStage = dto.mobilizationStage;
      log.civilianBookingPaused = civilianBookingPaused;
      log.totalRequisitionedVehicles = dto.requisitionFleetTargetCount;
      log.evacuatedCitizensCount = evacuatedCitizensCount;
    }

    const saved = await this.logRepo.save(log);

    return {
      incidentReference: saved.incidentReference,
      mobilizationStage: saved.mobilizationStage,
      civilianBookingPaused: saved.civilianBookingPaused,
      totalRequisitionedVehicles: saved.totalRequisitionedVehicles,
      evacuatedCitizensCount: saved.evacuatedCitizensCount,
      authorizedAt: saved.createdAt ? saved.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}

