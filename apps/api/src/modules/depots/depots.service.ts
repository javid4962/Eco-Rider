import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { FleetDepot } from '../../database/entities/fleet-depot.entity';
import { DepotBayAllocation } from '../../database/entities/depot-bay-allocation.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import {
  FleetDepotDto,
  DepotBayAllocationDto,
  AllocateBayRequestDto,
} from '@ecoride/contracts';

@Injectable()
export class DepotsService {
  constructor(
    @InjectRepository(FleetDepot)
    private readonly depotRepo: Repository<FleetDepot>,
    @InjectRepository(DepotBayAllocation)
    private readonly allocationRepo: Repository<DepotBayAllocation>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * List authorized government & municipal EV depots in Andhra Pradesh
   */
  async listDepots(city?: string): Promise<FleetDepotDto[]> {
    let depots = await this.depotRepo.find({ where: { isActive: true } });

    if (depots.length === 0) {
      // Seed default AP Capital Corridor depots
      const defaults = [
        this.depotRepo.create({
          name: 'AP State Secretariat EV Fleet Depot',
          code: 'DEP-SEC-01',
          city: 'Amaravathi',
          address: 'Velagapudi Government Complex, Amaravathi, AP 522238',
          latitude: 16.5415,
          longitude: 80.5155,
          totalParkingBays: 60,
          availableParkingBays: 60,
          totalChargingGuns: 24,
          availableChargingGuns: 24,
          isGovernmentAuthorized: true,
          securityContact: '+91 866 242 8111',
          isActive: true,
        }),
        this.depotRepo.create({
          name: 'Pandit Nehru Bus Station EV Depot',
          code: 'DEP-PNBS-01',
          city: 'Vijayawada',
          address: 'PNBS Terminal Complex, Vijayawada, AP 520013',
          latitude: 16.508,
          longitude: 80.612,
          totalParkingBays: 100,
          availableParkingBays: 100,
          totalChargingGuns: 40,
          availableChargingGuns: 40,
          isGovernmentAuthorized: true,
          securityContact: '+91 866 242 8222',
          isActive: true,
        }),
        this.depotRepo.create({
          name: 'AIIMS Mangalagiri Fleet Parking & Charge Bay',
          code: 'DEP-AIIMS-01',
          city: 'Mangalagiri',
          address: 'AIIMS Campus NH-16, Mangalagiri, AP 522503',
          latitude: 16.442,
          longitude: 80.565,
          totalParkingBays: 40,
          availableParkingBays: 40,
          totalChargingGuns: 16,
          availableChargingGuns: 16,
          isGovernmentAuthorized: true,
          securityContact: '+91 866 242 8333',
          isActive: true,
        }),
      ];
      depots = await this.depotRepo.save(defaults);
    }

    const filtered = city
      ? depots.filter((d) => d.city.toLowerCase() === city.toLowerCase())
      : depots;

    return filtered.map((d) => ({
      id: d.id,
      name: d.name,
      code: d.code,
      city: d.city,
      address: d.address,
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
      totalParkingBays: d.totalParkingBays,
      availableParkingBays: d.availableParkingBays,
      totalChargingGuns: d.totalChargingGuns,
      availableChargingGuns: d.availableChargingGuns,
      isGovernmentAuthorized: d.isGovernmentAuthorized,
      securityContact: d.securityContact,
      isActive: d.isActive,
    }));
  }

  /**
   * Allocate depot parking or overnight charging bay for verified EV
   */
  async allocateBay(dto: AllocateBayRequestDto): Promise<DepotBayAllocationDto> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${dto.vehicleId} not found`);
    }

    const depot = await this.depotRepo.findOne({ where: { id: dto.depotId } });
    if (!depot) {
      throw new NotFoundException(`Depot ${dto.depotId} not found`);
    }

    if (depot.availableParkingBays <= 0) {
      throw new BadRequestException('No available parking bays at this depot');
    }

    if (dto.purpose === 'CHARGING' && depot.availableChargingGuns <= 0) {
      throw new BadRequestException('No available charging guns at this depot');
    }

    const now = new Date();
    const durationHours = Math.max(1, dto.hoursDuration || 8);
    const allocatedUntil = new Date(now.getTime() + durationHours * 3600000);
    const bayNumber = `BAY-${depot.code}-${depot.totalParkingBays - depot.availableParkingBays + 1}`;

    let savedAllocation: DepotBayAllocation;
    await this.dataSource.transaction(async (manager) => {
      // Decrement available capacity
      depot.availableParkingBays -= 1;
      if (dto.purpose === 'CHARGING') {
        depot.availableChargingGuns -= 1;
      }
      await manager.save(FleetDepot, depot);

      const allocation = manager.create(DepotBayAllocation, {
        depotId: depot.id,
        vehicleId: vehicle.id,
        bayNumber,
        allocatedFrom: now,
        allocatedUntil,
        purpose: dto.purpose,
        status: 'ACTIVE',
      });
      savedAllocation = await manager.save(DepotBayAllocation, allocation);
    });

    return {
      id: savedAllocation!.id,
      depotId: depot.id,
      depotName: depot.name,
      vehicleId: vehicle.id,
      vehiclePlate: vehicle.registrationNumber,
      bayNumber,
      allocatedFrom: savedAllocation!.allocatedFrom.toISOString(),
      allocatedUntil: savedAllocation!.allocatedUntil.toISOString(),
      purpose: savedAllocation!.purpose,
      status: savedAllocation!.status,
    };
  }

  /**
   * Release allocated depot bay
   */
  async releaseBay(allocationId: string): Promise<DepotBayAllocationDto> {
    const allocation = await this.allocationRepo.findOne({ where: { id: allocationId } });
    if (!allocation) {
      throw new NotFoundException(`Allocation ${allocationId} not found`);
    }

    if (allocation.status !== 'ACTIVE') {
      throw new BadRequestException(`Allocation is already in ${allocation.status} status`);
    }

    const depot = await this.depotRepo.findOne({ where: { id: allocation.depotId } });
    const vehicle = await this.vehicleRepo.findOne({ where: { id: allocation.vehicleId } });

    await this.dataSource.transaction(async (manager) => {
      allocation.status = 'RELEASED';
      await manager.save(DepotBayAllocation, allocation);

      if (depot) {
        depot.availableParkingBays = Math.min(
          depot.totalParkingBays,
          depot.availableParkingBays + 1,
        );
        if (allocation.purpose === 'CHARGING') {
          depot.availableChargingGuns = Math.min(
            depot.totalChargingGuns,
            depot.availableChargingGuns + 1,
          );
        }
        await manager.save(FleetDepot, depot);
      }
    });

    return {
      id: allocation.id,
      depotId: allocation.depotId,
      depotName: depot?.name || 'Depot',
      vehicleId: allocation.vehicleId,
      vehiclePlate: vehicle?.registrationNumber || 'AP 16 EV 0000',
      bayNumber: allocation.bayNumber,
      allocatedFrom: allocation.allocatedFrom.toISOString(),
      allocatedUntil: allocation.allocatedUntil.toISOString(),
      purpose: allocation.purpose,
      status: 'RELEASED',
    };
  }
}

