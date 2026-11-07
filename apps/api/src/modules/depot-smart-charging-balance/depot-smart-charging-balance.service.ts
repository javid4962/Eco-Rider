import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotSmartChargingPlanEntity } from '../../database/entities/depot-smart-charging-plan.entity';
import {
  DepotSmartChargingPlanRequest,
  DepotSmartChargingPlanResult,
  VehicleChargingAllocation,
} from '@ecoride/contracts';

@Injectable()
export class DepotSmartChargingBalanceService {
  constructor(
    @InjectRepository(DepotSmartChargingPlanEntity)
    private readonly planRepo: Repository<DepotSmartChargingPlanEntity>,
  ) {}

  async computeChargingBalance(req: DepotSmartChargingPlanRequest): Promise<DepotSmartChargingPlanResult> {
    if (!req.depotId) {
      throw new BadRequestException('depotId is required');
    }
    if (req.totalAvailableAcKw <= 0) {
      throw new BadRequestException('totalAvailableAcKw must be positive');
    }
    if (!req.vehicles || req.vehicles.length === 0) {
      throw new BadRequestException('At least one vehicle requirement is required');
    }

    const now = new Date().getTime();

    // Calculate priority scores and required kWh
    const scoredVehicles = req.vehicles.map((v) => {
      const deadline = new Date(v.departureDeadline).getTime();
      const hoursUntilDeparture = Math.max(0.5, (deadline - now) / (1000 * 60 * 60));
      const socDeficit = Math.max(0, v.targetSocPct - v.currentSocPct);
      const energyNeededKwh = (socDeficit / 100) * v.batteryCapacityKwh;
      // High deficit + tight deadline = high priority
      const priorityScore = Math.round((energyNeededKwh / hoursUntilDeparture) * 10) / 10;
      return {
        ...v,
        energyNeededKwh,
        priorityScore,
        hoursUntilDeparture,
      };
    });

    const totalPriority = scoredVehicles.reduce((sum, v) => sum + Math.max(0.1, v.priorityScore), 0);

    let totalAllocatedKw = 0;
    const allocations: VehicleChargingAllocation[] = scoredVehicles.map((v) => {
      const share = Math.max(0.1, v.priorityScore) / totalPriority;
      // Max standard AC charger capacity per vehicle is 22 kW
      const allocatedKw = Math.min(22, Math.round(share * req.totalAvailableAcKw * 10) / 10);
      totalAllocatedKw += allocatedKw;

      const chargeHours = allocatedKw > 0 ? v.energyNeededKwh / allocatedKw : 8;
      const estimatedFullChargeAt = new Date(now + chargeHours * 3600 * 1000).toISOString();

      return {
        vehicleId: v.vehicleId,
        allocatedKw,
        priorityScore: v.priorityScore,
        estimatedFullChargeAt,
      };
    });

    const unmetDemandKw = Math.max(
      0,
      scoredVehicles.reduce((sum, v) => sum + v.energyNeededKwh, 0) - totalAllocatedKw,
    );

    const plan = this.planRepo.create({
      depotId: req.depotId,
      totalAllocatedKw,
      availableCapacityKw: req.totalAvailableAcKw,
      unmetDemandKw,
      allocationsJson: JSON.stringify(allocations),
    });

    const saved = await this.planRepo.save(plan);

    return {
      id: saved.id,
      depotId: saved.depotId,
      totalAllocatedKw: Number(saved.totalAllocatedKw),
      availableCapacityKw: Number(saved.availableCapacityKw),
      unmetDemandKw: Number(saved.unmetDemandKw),
      allocations,
      calculatedAt: saved.calculatedAt ? saved.calculatedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getDepotLatestPlan(depotId: string): Promise<DepotSmartChargingPlanResult> {
    const record = await this.planRepo.findOne({
      where: { depotId },
      order: { calculatedAt: 'DESC' },
    });
    if (!record) {
      throw new NotFoundException(`No charging plans found for depot ${depotId}`);
    }

    return {
      id: record.id,
      depotId: record.depotId,
      totalAllocatedKw: Number(record.totalAllocatedKw),
      availableCapacityKw: Number(record.availableCapacityKw),
      unmetDemandKw: Number(record.unmetDemandKw),
      allocations: JSON.parse(record.allocationsJson),
      calculatedAt: record.calculatedAt ? record.calculatedAt.toISOString() : new Date().toISOString(),
    };
  }
}

