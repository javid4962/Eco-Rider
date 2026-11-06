import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DepotLoadStatusDto,
  BalanceDepotLoadRequestDto,
  ChargingGunAllocationDto,
} from '@ecoride/contracts';
import { DepotPowerAllocation } from '../../database/entities/depot-power-allocation.entity';

@Injectable()
export class DepotLoadBalancingService {
  constructor(
    @InjectRepository(DepotPowerAllocation)
    private readonly allocationRepo: Repository<DepotPowerAllocation>,
  ) {}

  async balanceDepotLoad(dto: BalanceDepotLoadRequestDto): Promise<DepotLoadStatusDto> {
    if (!dto.depotId || dto.maxTransformerCapacityKw <= 0) {
      throw new BadRequestException('Valid depot ID and positive transformer capacity are required');
    }

    if (!dto.vehicles || dto.vehicles.length === 0) {
      return {
        depotId: dto.depotId,
        maxTransformerCapacityKw: dto.maxTransformerCapacityKw,
        currentTotalDrawKw: 0,
        utilizationPercentage: 0,
        activeVehiclesCount: 0,
        allocations: [],
        loadSheddingActive: false,
        evaluatedAt: new Date().toISOString(),
      };
    }

    const maxGunPowerKw = 60.0; // 60 kW DC Fast Gun maximum
    let totalDemandKw = 0;

    // Calculate priority score: higher deficit and earlier departure = higher score
    const scored = dto.vehicles.map((v) => {
      const deficitPercent = Math.max(0, v.targetSocPercent - v.currentSocPercent);
      const departureTime = new Date(v.departureScheduledAt).getTime();
      const now = Date.now();
      const hoursToDeparture = Math.max(0.5, (departureTime - now) / 3600000);
      const priorityScore = parseFloat((deficitPercent / hoursToDeparture).toFixed(2));
      const requestedPower = deficitPercent > 0 ? maxGunPowerKw : 0;
      totalDemandKw += requestedPower;

      return {
        ...v,
        priorityScore,
        requestedPower,
      };
    });

    // Sort descending by priority score
    scored.sort((a, b) => b.priorityScore - a.priorityScore);

    let loadSheddingActive = false;
    let scalingFactor = 1.0;

    if (totalDemandKw > dto.maxTransformerCapacityKw) {
      loadSheddingActive = true;
      scalingFactor = dto.maxTransformerCapacityKw / totalDemandKw;
    }

    let allocatedTotalKw = 0;
    const allocations: ChargingGunAllocationDto[] = scored.map((s) => {
      const assignedPowerKw = parseFloat((s.requestedPower * scalingFactor).toFixed(1));
      allocatedTotalKw += assignedPowerKw;
      return {
        gunId: s.gunId,
        vehicleRegistrationNumber: s.vehicleRegistrationNumber,
        assignedPowerKw,
        priorityScore: s.priorityScore,
        departureScheduledAt: s.departureScheduledAt,
      };
    });

    allocatedTotalKw = parseFloat(allocatedTotalKw.toFixed(1));
    const utilizationPercentage = parseFloat(
      ((allocatedTotalKw / dto.maxTransformerCapacityKw) * 100).toFixed(1),
    );

    const record = this.allocationRepo.create({
      depotId: dto.depotId,
      maxTransformerCapacityKw: dto.maxTransformerCapacityKw,
      totalAllocatedKw: allocatedTotalKw,
      activeVehiclesCount: dto.vehicles.length,
      loadSheddingActive,
    });
    await this.allocationRepo.save(record);

    return {
      depotId: dto.depotId,
      maxTransformerCapacityKw: dto.maxTransformerCapacityKw,
      currentTotalDrawKw: allocatedTotalKw,
      utilizationPercentage,
      activeVehiclesCount: dto.vehicles.length,
      allocations,
      loadSheddingActive,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

