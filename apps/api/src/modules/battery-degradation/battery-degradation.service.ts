import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BatteryDegradationDto,
  BessRepurposingOrderDto,
  EvaluateDegradationRequestDto,
  BessRepurposingStatus,
} from '@ecoride/contracts';
import { BatteryDegradationRecord } from '../../database/entities/battery-degradation-record.entity';
import { BessRepurposingOrder } from '../../database/entities/bess-repurposing-order.entity';

@Injectable()
export class BatteryDegradationService {
  constructor(
    @InjectRepository(BatteryDegradationRecord)
    private readonly recordRepo: Repository<BatteryDegradationRecord>,
    @InjectRepository(BessRepurposingOrder)
    private readonly orderRepo: Repository<BessRepurposingOrder>,
  ) {}

  /**
   * Evaluates battery pack degradation and generates second-life BESS repurposing order when SoH < 70%
   */
  async evaluateDegradation(dto: EvaluateDegradationRequestDto): Promise<BatteryDegradationDto> {
    const stateOfHealth = Math.round((dto.currentCapacityKwh / dto.initialCapacityKwh) * 1000) / 10;
    const isSecondLife = stateOfHealth < 70.0;

    // Remaining useful life estimation in months (degradation acceleration under AP high ambient heat)
    const tempStressFactor = dto.averageOperatingTempCelsius > 38.0 ? 1.25 : 1.0;
    const projectedRulMonths = Math.max(0, Math.round(((stateOfHealth - 65.0) / 0.8) / tempStressFactor));

    const record = this.recordRepo.create({
      batteryPackSerial: dto.batteryPackSerial,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      initialCapacityKwh: dto.initialCapacityKwh,
      currentCapacityKwh: dto.currentCapacityKwh,
      stateOfHealthPercent: stateOfHealth,
      cycleCount: dto.cycleCount,
      projectedRulMonths,
      secondLifeRecommended: isSecondLife,
    });
    const savedRecord = await this.recordRepo.save(record);

    if (isSecondLife) {
      const orderNumber = `BESS-${dto.batteryPackSerial.substring(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
      const repurposingOrder = this.orderRepo.create({
        orderNumber,
        batteryPackSerial: dto.batteryPackSerial,
        designatedDepotId: '00000000-0000-4000-8000-000000000001',
        intendedUse: 'Depot Stationary Solar Energy Storage Buffer',
        status: BessRepurposingStatus.PENDING_INSPECTION,
      });
      await this.orderRepo.save(repurposingOrder);
    }

    return {
      id: savedRecord.id,
      batteryPackSerial: savedRecord.batteryPackSerial,
      vehicleRegistrationNumber: savedRecord.vehicleRegistrationNumber,
      initialCapacityKwh: Number(savedRecord.initialCapacityKwh),
      currentCapacityKwh: Number(savedRecord.currentCapacityKwh),
      stateOfHealthPercent: Number(savedRecord.stateOfHealthPercent),
      cycleCount: savedRecord.cycleCount,
      projectedRulMonths: savedRecord.projectedRulMonths,
      secondLifeRecommended: savedRecord.secondLifeRecommended,
      evaluatedAt: savedRecord.evaluatedAt.toISOString(),
    };
  }

  async getRepurposingOrders(): Promise<BessRepurposingOrderDto[]> {
    const orders = await this.orderRepo.find();
    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      batteryPackSerial: o.batteryPackSerial,
      designatedDepotId: o.designatedDepotId,
      intendedUse: o.intendedUse,
      status: o.status as BessRepurposingStatus,
      approvedAt: o.approvedAt?.toISOString(),
      createdAt: o.createdAt.toISOString(),
    }));
  }
}

