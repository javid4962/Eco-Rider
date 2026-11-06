import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CycloneRelocationPlan } from '../../database/entities/cyclone-relocation-plan.entity';
import {
  CycloneAlertFeedDto,
  TriggerFleetRelocationDto,
  FleetRelocationPlanResult,
  CycloneSeverityAlert,
  FleetRelocationStatus,
} from '@ecoride/contracts';

@Injectable()
export class CycloneResilienceService {
  constructor(
    @InjectRepository(CycloneRelocationPlan)
    private readonly planRepo: Repository<CycloneRelocationPlan>,
  ) {}

  async createRelocationPlan(
    alertDto: CycloneAlertFeedDto,
    relocateDto: TriggerFleetRelocationDto,
  ): Promise<FleetRelocationPlanResult> {
    const totalVehicles = relocateDto.vehicleIds.length;
    const elevationDeltaMeters = 35.0; // AIIMS Mangalagiri / Velagapudi elevated depot delta

    const plan = this.planRepo.create({
      cycloneName: alertDto.cycloneName,
      alertLevel: alertDto.alertLevel,
      sourceFloodZone: relocateDto.sourceFloodZone,
      targetSafeStagingHub: relocateDto.targetSafeStagingHub,
      totalVehiclesTargeted: totalVehicles,
      successfullyStagedCount: 0,
      relocationStatus: FleetRelocationStatus.RELOCATION_DISPATCHED,
      elevationDeltaMeters,
      instructions: `AUTONOMOUS FLEET RELOCATION: Cyclone ${alertDto.cycloneName} (${alertDto.alertLevel}). Move ${totalVehicles} EVs from ${relocateDto.sourceFloodZone} to ${relocateDto.targetSafeStagingHub}. Wind: ${alertDto.projectedWindSpeedKmph} km/h, Rain: ${alertDto.expectedRainfallMm} mm.`,
    });

    const saved = await this.planRepo.save(plan);

    return {
      planId: saved.id,
      alertLevel: saved.alertLevel as CycloneSeverityAlert,
      totalVehiclesTargeted: saved.totalVehiclesTargeted,
      successfullyStagedCount: saved.successfullyStagedCount,
      relocationStatus: saved.relocationStatus as FleetRelocationStatus,
      elevationDeltaMeters: Number(saved.elevationDeltaMeters),
      evacuationTimestamp: saved.createdAt.toISOString(),
      instructions: saved.instructions,
    };
  }

  async updateStagingProgress(
    planId: string,
    stagedCountIncrement: number,
  ): Promise<FleetRelocationPlanResult> {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException(`Relocation plan ${planId} not found`);
    }

    plan.successfullyStagedCount = Math.min(
      plan.totalVehiclesTargeted,
      plan.successfullyStagedCount + stagedCountIncrement,
    );

    if (plan.successfullyStagedCount >= plan.totalVehiclesTargeted) {
      plan.relocationStatus = FleetRelocationStatus.SAFE_STAGED;
    } else {
      plan.relocationStatus = FleetRelocationStatus.IN_TRANSIT;
    }

    const updated = await this.planRepo.save(plan);

    return {
      planId: updated.id,
      alertLevel: updated.alertLevel as CycloneSeverityAlert,
      totalVehiclesTargeted: updated.totalVehiclesTargeted,
      successfullyStagedCount: updated.successfullyStagedCount,
      relocationStatus: updated.relocationStatus as FleetRelocationStatus,
      elevationDeltaMeters: Number(updated.elevationDeltaMeters),
      evacuationTimestamp: updated.updatedAt.toISOString(),
      instructions: updated.instructions,
    };
  }

  async getPlan(id: string): Promise<CycloneRelocationPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan ${id} not found`);
    }
    return plan;
  }
}

