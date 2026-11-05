import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MaintenanceWorkOrderDto,
  CreateMaintenanceOrderDto,
  MaintenanceType,
  WorkOrderStatus,
} from '@ecoride/contracts';
import { FleetMaintenanceOrder } from '../../database/entities/fleet-maintenance-order.entity';

@Injectable()
export class FleetMaintenanceService {
  constructor(
    @InjectRepository(FleetMaintenanceOrder)
    private readonly orderRepo: Repository<FleetMaintenanceOrder>,
  ) {}

  checkVehicleMaintenanceDue(odometerKm: number, lastServiceOdometerKm: number): { isDue: boolean; reason?: string } {
    const kmSinceLastService = odometerKm - lastServiceOdometerKm;
    if (kmSinceLastService >= 10000) {
      return {
        isDue: true,
        reason: `Periodic maintenance threshold reached (${kmSinceLastService} km since last service, >= 10,000 km threshold)`,
      };
    }
    return { isDue: false };
  }

  async createOrder(dto: CreateMaintenanceOrderDto): Promise<MaintenanceWorkOrderDto> {
    let estimatedCostPaise = 150000; // default ₹1500.00
    switch (dto.serviceType) {
      case MaintenanceType.BRAKE_PAD_REPLACEMENT:
        estimatedCostPaise = 220000;
        break;
      case MaintenanceType.TIRE_ROTATION_ALIGNMENT:
        estimatedCostPaise = 180000;
        break;
      case MaintenanceType.SUSPENSION_REGENERATION:
        estimatedCostPaise = 350000;
        break;
      case MaintenanceType.THERMAL_COOLANT_FLUSH:
        estimatedCostPaise = 120000;
        break;
      case MaintenanceType.ROUTINE_SCHEDULED_SERVICE:
      default:
        estimatedCostPaise = 150000;
        break;
    }

    const orderNumber = `WO-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = this.orderRepo.create({
      orderNumber,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      serviceType: dto.serviceType,
      depotId: dto.depotId,
      currentOdometerKm: dto.currentOdometerKm,
      triggerReason: dto.triggerReason,
      estimatedCostPaise,
      status: WorkOrderStatus.SCHEDULED,
      scheduledDate: dto.scheduledDate,
    });

    const saved = await this.orderRepo.save(order);
    return this.mapToDto(saved);
  }

  async completeOrder(orderNumber: string, actualCostPaise: number): Promise<MaintenanceWorkOrderDto> {
    if (actualCostPaise < 0) {
      throw new BadRequestException('Actual cost cannot be negative');
    }

    const order = await this.orderRepo.findOne({ where: { orderNumber } });
    if (!order) {
      throw new NotFoundException(`Maintenance work order ${orderNumber} not found`);
    }

    order.actualCostPaise = actualCostPaise;
    order.status = WorkOrderStatus.COMPLETED;
    order.completedAt = new Date();

    const saved = await this.orderRepo.save(order);
    return this.mapToDto(saved);
  }

  private mapToDto(o: FleetMaintenanceOrder): MaintenanceWorkOrderDto {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      vehicleRegistrationNumber: o.vehicleRegistrationNumber,
      serviceType: o.serviceType as MaintenanceType,
      depotId: o.depotId,
      currentOdometerKm: o.currentOdometerKm,
      triggerReason: o.triggerReason,
      estimatedCostPaise: o.estimatedCostPaise,
      actualCostPaise: o.actualCostPaise ?? undefined,
      status: o.status as WorkOrderStatus,
      scheduledDate: o.scheduledDate,
      completedAt: o.completedAt ? o.completedAt.toISOString() : undefined,
    };
  }
}

