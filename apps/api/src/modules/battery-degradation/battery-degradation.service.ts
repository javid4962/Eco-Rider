import { Injectable } from '@nestjs/common';
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

  async evaluateDegradation(dto: EvaluateDegradationRequestDto): Promise<BatteryDegradationDto> {
    const stateOfHealthPercent = parseFloat(
      ((dto.currentCapacityKwh / dto.initialCapacityKwh) * 100).toFixed(2),
    );

    // BESS threshold: If SoH drops below 70%, unviable for dynamic vehicle acceleration
    // but optimal for stationary depot solar buffer energy storage
    const secondLifeRecommended = stateOfHealthPercent < 70.0;
    const projectedRemainingUsefulLifeMonths = Math.max(0, Math.round((stateOfHealthPercent - 50.0) * 1.5));

    const record = this.recordRepo.create({
      batteryPackSerial: dto.batteryPackSerial,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      initialCapacityKwh: dto.initialCapacityKwh,
      currentCapacityKwh: dto.currentCapacityKwh,
      stateOfHealthPercent,
      cycleCount: dto.cycleCount,
      projectedRulMonths: projectedRemainingUsefulLifeMonths,
      secondLifeRecommended,
    });

    const savedRecord = await this.recordRepo.save(record);

    if (secondLifeRecommended) {
      const orderNumber = `BESS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
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
      projectedRemainingUsefulLifeMonths,
      secondLifeRecommended: savedRecord.secondLifeRecommended,
      evaluatedAt: savedRecord.evaluatedAt ? savedRecord.evaluatedAt.toISOString() : new Date().toISOString(),
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
      createdAt: o.createdAt.toISOString(),
    }));
  }
}
