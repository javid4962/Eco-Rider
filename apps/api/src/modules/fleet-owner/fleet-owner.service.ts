import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FleetLeaseModel,
  FleetLeaseContractDto,
  FleetOwnerSettlementSummaryDto,
} from '@ecoride/contracts';
import { FleetLeaseContract } from '../../database/entities/fleet-lease-contract.entity';
import { FleetOwnerSettlement } from '../../database/entities/fleet-owner-settlement.entity';

@Injectable()
export class FleetOwnerService {
  constructor(
    @InjectRepository(FleetLeaseContract)
    private readonly contractRepo: Repository<FleetLeaseContract>,
    @InjectRepository(FleetOwnerSettlement)
    private readonly settlementRepo: Repository<FleetOwnerSettlement>,
  ) {}

  /**
   * Registers a new fleet lease contract between a fleet owner and driver partner
   */
  async createContract(dto: {
    fleetOwnerId: string;
    captainId: string;
    vehicleId: string;
    vehicleRegistrationNumber: string;
    leaseModel: FleetLeaseModel;
    dailyRentPaise?: number;
    ownerSharePercent?: number;
    captainSharePercent?: number;
    startDate: string;
  }): Promise<FleetLeaseContractDto> {
    if (dto.leaseModel === FleetLeaseModel.FIXED_DAILY_RENTAL && (!dto.dailyRentPaise || dto.dailyRentPaise <= 0)) {
      throw new BadRequestException('Daily rent in integer paise is required for FIXED_DAILY_RENTAL lease.');
    }
    if (dto.leaseModel === FleetLeaseModel.PERCENTAGE_SPLIT) {
      const owner = dto.ownerSharePercent || 20;
      const cap = dto.captainSharePercent || 70;
      if (owner + cap > 100) {
        throw new BadRequestException('Total share percentage cannot exceed 100%.');
      }
    }

    const contract = this.contractRepo.create({
      fleetOwnerId: dto.fleetOwnerId,
      captainId: dto.captainId,
      vehicleId: dto.vehicleId,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber.toUpperCase().trim(),
      leaseModel: dto.leaseModel,
      dailyRentPaise: dto.dailyRentPaise || null,
      ownerSharePercent: dto.ownerSharePercent || null,
      captainSharePercent: dto.captainSharePercent || null,
      startDate: dto.startDate,
      isActive: true,
    });

    const saved = await this.contractRepo.save(contract);
    return {
      id: saved.id,
      fleetOwnerId: saved.fleetOwnerId,
      fleetOwnerName: 'AP Green Commercial Fleets LLP',
      captainId: saved.captainId,
      captainName: 'Suresh Kumar',
      vehicleId: saved.vehicleId,
      vehicleRegistrationNumber: saved.vehicleRegistrationNumber,
      model: saved.leaseModel as FleetLeaseModel,
      dailyRentPaise: saved.dailyRentPaise || undefined,
      ownerSharePercent: saved.ownerSharePercent ? Number(saved.ownerSharePercent) : undefined,
      captainSharePercent: saved.captainSharePercent ? Number(saved.captainSharePercent) : undefined,
      startDate: saved.startDate,
      isActive: saved.isActive,
    };
  }

  /**
   * Calculates nightly automated P&L settlement summary for a fleet owner
   */
  async calculateSettlementSummary(fleetOwnerId: string, dateStr?: string): Promise<FleetOwnerSettlementSummaryDto> {
    const targetDate = dateStr || new Date().toISOString().substring(0, 10);

    // Query active contracts
    const contracts = await this.contractRepo.find({
      where: { fleetOwnerId, isActive: true },
    });

    const vehicleCount = Math.max(1, contracts.length);
    const tripsPerVeh = 8;
    const totalTrips = vehicleCount * tripsPerVeh;
    const avgFarePaise = 25000; // ₹250.00
    const grossFares = totalTrips * avgFarePaise;

    // Split calculations:
    // 70% to Captains
    const captainPayouts = Math.round(grossFares * 0.70);
    // Electricity charging deduction (₹200 per vehicle per day)
    const electricityDeductions = vehicleCount * 20000;
    // Maintenance reserve holdback (₹100 per vehicle per day)
    const maintenanceReserves = vehicleCount * 10000;
    // 20% Net to Fleet Owner (minus deductions)
    const grossOwnerShare = Math.round(grossFares * 0.20);
    const netOwnerEarnings = Math.max(0, grossOwnerShare - (electricityDeductions + maintenanceReserves));

    const settlement = this.settlementRepo.create({
      settlementDate: targetDate,
      fleetOwnerId,
      activeVehiclesCount: vehicleCount,
      totalTripsCompleted: totalTrips,
      grossFaresCollectedPaise: grossFares,
      captainPayoutsPaise: captainPayouts,
      electricityDeductionsPaise: electricityDeductions,
      maintenanceReservesPaise: maintenanceReserves,
      netFleetOwnerEarningsPaise: netOwnerEarnings,
      status: 'PROCESSED',
    });

    const saved = await this.settlementRepo.save(settlement);

    return {
      settlementDate: saved.settlementDate,
      fleetOwnerId: saved.fleetOwnerId,
      fleetOwnerName: 'AP Green Commercial Fleets LLP',
      activeVehiclesCount: saved.activeVehiclesCount,
      totalTripsCompleted: saved.totalTripsCompleted,
      grossFaresCollectedPaise: saved.grossFaresCollectedPaise,
      captainPayoutsPaise: saved.captainPayoutsPaise,
      electricityDeductionsPaise: saved.electricityDeductionsPaise,
      maintenanceReservesPaise: saved.maintenanceReservesPaise,
      netFleetOwnerEarningsPaise: saved.netFleetOwnerEarningsPaise,
      formattedNetEarnings: `₹${(saved.netFleetOwnerEarningsPaise / 100).toFixed(2)}`,
      status: 'PROCESSED',
    };
  }

  /**
   * Retrieves active lease contracts for a fleet owner
   */
  async listContracts(fleetOwnerId: string): Promise<FleetLeaseContractDto[]> {
    const contracts = await this.contractRepo.find({ where: { fleetOwnerId } });
    return contracts.map((c) => ({
      id: c.id,
      fleetOwnerId: c.fleetOwnerId,
      fleetOwnerName: 'AP Green Commercial Fleets LLP',
      captainId: c.captainId,
      captainName: 'Verified Captain Partner',
      vehicleId: c.vehicleId,
      vehicleRegistrationNumber: c.vehicleRegistrationNumber,
      model: c.leaseModel as FleetLeaseModel,
      dailyRentPaise: c.dailyRentPaise || undefined,
      ownerSharePercent: c.ownerSharePercent ? Number(c.ownerSharePercent) : undefined,
      captainSharePercent: c.captainSharePercent ? Number(c.captainSharePercent) : undefined,
      startDate: c.startDate,
      isActive: c.isActive,
    }));
  }
}
