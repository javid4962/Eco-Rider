import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { V2vRescueMission } from '../../database/entities/v2v-rescue-mission.entity';
import {
  RequestV2vRescueDto,
  V2vRescueMissionResult,
  V2vRescueStatus,
} from '@ecoride/contracts';

@Injectable()
export class V2vRescueService {
  private readonly baseDispatchFeePaise = 35000; // ₹350.00
  private readonly energyRatePaisePerKwh = 1200; // ₹12.00/kWh

  constructor(
    @InjectRepository(V2vRescueMission)
    private readonly missionRepo: Repository<V2vRescueMission>,
  ) {}

  async dispatchRescue(dto: RequestV2vRescueDto): Promise<V2vRescueMissionResult> {
    if (dto.currentSocPercent >= 15.0) {
      throw new BadRequestException(
        `Vehicle battery SoC (${dto.currentSocPercent}%) is sufficient; V2V roadside emergency rescue is reserved for critical depletion (<15%) in Andhra Pradesh`,
      );
    }

    const estimatedKwh = dto.targetKwhRequired || 10.0;
    const energyFeePaise = Math.round(estimatedKwh * this.energyRatePaisePerKwh);
    const subtotal = this.baseDispatchFeePaise + energyFeePaise;
    // Statutory AP GST: 18% SAC 9987 for roadside EV charging services
    const gstPaise = Math.round(subtotal * 0.18);
    const totalCostPaise = subtotal + gstPaise;

    const mission = this.missionRepo.create({
      rescueVehicleId: 'RESCUE-VAN-AP16-01',
      rescueCaptainId: 'CAPT-RESCUE-LEAD-01',
      strandedVehicleId: dto.strandedVehicleId,
      status: V2vRescueStatus.DISPATCHED,
      etaMinutes: 18,
      startSocPercent: dto.currentSocPercent,
      targetKwhRequired: estimatedKwh,
      transferredKwh: 0,
      baseDispatchFeePaise: this.baseDispatchFeePaise,
      energyFeePaise,
      gstPaise,
      totalCostPaise,
      highwayOrCorridor: dto.highwayOrCorridorName || 'AP Urban Roadway',
    });

    const saved = await this.missionRepo.save(mission);

    return {
      missionId: saved.id,
      rescueVehicleId: saved.rescueVehicleId,
      rescueCaptainId: saved.rescueCaptainId,
      strandedVehicleId: saved.strandedVehicleId,
      status: saved.status as V2vRescueStatus,
      etaMinutes: saved.etaMinutes,
      transferredKwh: saved.transferredKwh,
      baseDispatchFeePaise: saved.baseDispatchFeePaise,
      energyFeePaise: saved.energyFeePaise,
      gstPaise: saved.gstPaise,
      totalRescueCostPaise: saved.totalCostPaise,
      totalCostPaise: saved.totalCostPaise,
    };
  }

  async completeRescue(
    missionId: string,
    actualTransferredKwh: number,
  ): Promise<V2vRescueMissionResult> {
    const mission = await this.missionRepo.findOne({ where: { id: missionId } });
    if (!mission) {
      throw new NotFoundException(`Rescue mission ${missionId} not found`);
    }

    const energyFeePaise = Math.round(actualTransferredKwh * this.energyRatePaisePerKwh);
    const subtotal = mission.baseDispatchFeePaise + energyFeePaise;
    const gstPaise = Math.round(subtotal * 0.18);
    const totalCostPaise = subtotal + gstPaise;

    mission.transferredKwh = actualTransferredKwh;
    mission.energyFeePaise = energyFeePaise;
    mission.gstPaise = gstPaise;
    mission.totalCostPaise = totalCostPaise;
    mission.status = V2vRescueStatus.COMPLETED;

    const updated = await this.missionRepo.save(mission);

    return {
      missionId: updated.id,
      rescueVehicleId: updated.rescueVehicleId,
      rescueCaptainId: updated.rescueCaptainId,
      strandedVehicleId: updated.strandedVehicleId,
      status: updated.status as V2vRescueStatus,
      etaMinutes: 0,
      transferredKwh: updated.transferredKwh,
      baseDispatchFeePaise: updated.baseDispatchFeePaise,
      energyFeePaise: updated.energyFeePaise,
      gstPaise: updated.gstPaise,
      totalRescueCostPaise: updated.totalCostPaise,
      totalCostPaise: updated.totalCostPaise,
    };
  }

  async getMission(id: string): Promise<V2vRescueMission> {
    const m = await this.missionRepo.findOne({ where: { id } });
    if (!m) {
      throw new NotFoundException(`Mission ${id} not found`);
    }
    return m;
  }
}
