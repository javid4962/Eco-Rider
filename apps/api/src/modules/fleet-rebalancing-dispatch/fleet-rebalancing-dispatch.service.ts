import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { MultiDistrictRebalancingOrderEntity } from '../../database/entities/multi-district-rebalancing-order.entity';
import {
  DistrictZoneDemandEstimate,
  MultiDistrictRepositioningOrder,
  MultiDistrictRepositioningStatus,
} from '@ecoride/contracts';

@Injectable()
export class FleetRebalancingDispatchService {
  constructor(
    @InjectRepository(MultiDistrictRebalancingOrderEntity)
    private readonly orderRepo: Repository<MultiDistrictRebalancingOrderEntity>,
  ) {}

  async generateRebalancingOrders(
    zoneDemands: DistrictZoneDemandEstimate[],
  ): Promise<MultiDistrictRepositioningOrder[]> {
    if (!zoneDemands || zoneDemands.length === 0) {
      throw new BadRequestException('zoneDemands array must not be empty');
    }

    const createdOrders: MultiDistrictRepositioningOrder[] = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour validity

    for (const demand of zoneDemands) {
      if (demand.deficitVehicles > 0) {
        // Source from neighbouring capital region district
        const sourceDistrict = demand.district === 'VIJAYAWADA' ? 'GUNTUR' : 'VIJAYAWADA';
        const orderNumber = `REBAL-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        // Bounty ₹80.00 (8000 paise) for inter-district repositioning
        const bountyPaise = 8000;

        const entity = this.orderRepo.create({
          orderNumber,
          sourceDistrict,
          targetDistrict: demand.district,
          targetZoneId: demand.zoneId,
          bountyPaise,
          status: 'OPEN',
          expiresAt,
        });

        const saved = await this.orderRepo.save(entity);

        createdOrders.push({
          id: saved.id,
          orderNumber: saved.orderNumber,
          sourceDistrict: saved.sourceDistrict,
          targetDistrict: saved.targetDistrict,
          targetZoneId: saved.targetZoneId,
          bountyPaise: Number(saved.bountyPaise),
          status: saved.status as MultiDistrictRepositioningStatus,
          expiresAt: saved.expiresAt.toISOString(),
          createdAt: saved.createdAt ? saved.createdAt.toISOString() : now.toISOString(),
        });
      }
    }

    return createdOrders;
  }

  async acceptOrder(
    orderId: string,
    captainId: string,
    vehicleId: string,
  ): Promise<MultiDistrictRepositioningOrder> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Repositioning order ${orderId} not found`);
    }
    if (order.status !== 'OPEN') {
      throw new BadRequestException(`Repositioning order is not OPEN (status: ${order.status})`);
    }

    order.captainId = captainId;
    order.vehicleId = vehicleId;
    order.status = 'ACCEPTED';

    const saved = await this.orderRepo.save(order);

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      sourceDistrict: saved.sourceDistrict,
      targetDistrict: saved.targetDistrict,
      targetZoneId: saved.targetZoneId,
      bountyPaise: Number(saved.bountyPaise),
      captainId: saved.captainId ?? undefined,
      vehicleId: saved.vehicleId ?? undefined,
      status: saved.status as MultiDistrictRepositioningStatus,
      expiresAt: saved.expiresAt.toISOString(),
      createdAt: saved.createdAt.toISOString(),
      completedAt: saved.completedAt ? saved.completedAt.toISOString() : undefined,
    };
  }

  async completeOrder(orderId: string): Promise<MultiDistrictRepositioningOrder> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Repositioning order ${orderId} not found`);
    }
    if (order.status !== 'ACCEPTED') {
      throw new BadRequestException(`Repositioning order cannot be completed from status ${order.status}`);
    }

    const now = new Date();
    order.status = 'COMPLETED';
    order.completedAt = now;

    const saved = await this.orderRepo.save(order);

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      sourceDistrict: saved.sourceDistrict,
      targetDistrict: saved.targetDistrict,
      targetZoneId: saved.targetZoneId,
      bountyPaise: Number(saved.bountyPaise),
      captainId: saved.captainId ?? undefined,
      vehicleId: saved.vehicleId ?? undefined,
      status: saved.status as MultiDistrictRepositioningStatus,
      expiresAt: saved.expiresAt.toISOString(),
      createdAt: saved.createdAt.toISOString(),
      completedAt: saved.completedAt ? saved.completedAt.toISOString() : now.toISOString(),
    };
  }
}
