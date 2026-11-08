import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepotMaintenanceWorkOrderEntity } from '../../database/entities/depot-maintenance-work-order.entity';
import {
  CreatePreventiveWorkOrderDto,
  DepotWorkOrderStatus,
  SparePartCategory,
} from '@ecoride/contracts';

@Injectable()
export class DepotInventoryMaintenanceService {
  constructor(
    @InjectRepository(DepotMaintenanceWorkOrderEntity)
    private readonly workOrderRepo: Repository<DepotMaintenanceWorkOrderEntity>,
  ) {}

  async createWorkOrder(dto: CreatePreventiveWorkOrderDto): Promise<DepotMaintenanceWorkOrderEntity> {
    let status = DepotWorkOrderStatus.SCHEDULED;
    let partsReservedUnits = 1;
    let estimatedLaborMinutes = 60;

    if (dto.availableStockUnits < 1) {
      status = DepotWorkOrderStatus.PARTS_SHORTAGE;
      partsReservedUnits = 0;
    }

    if (dto.partCategory === SparePartCategory.HV_CONTACTOR) {
      estimatedLaborMinutes = 120;
    } else if (dto.partCategory === SparePartCategory.REGEN_BRAKE_PAD) {
      estimatedLaborMinutes = 45;
    }

    const record = this.workOrderRepo.create({
      depotId: dto.depotId,
      vehicleId: dto.vehicleId,
      partCategory: dto.partCategory,
      status,
      odometerKm: dto.odometerKm,
      regenCyclesCount: dto.regenCyclesCount,
      estimatedLaborMinutes,
      partsReservedUnits,
      preventiveAlertIssued: true,
      createdAt: new Date(),
    });

    return this.workOrderRepo.save(record);
  }

  async getWorkOrder(id: string): Promise<DepotMaintenanceWorkOrderEntity> {
    const record = await this.workOrderRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Depot work order ${id} not found`);
    }
    return record;
  }
}

