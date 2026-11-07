import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgriProduceConsignmentEntity } from '../../database/entities/agri-produce-consignment.entity';
import {
  AgriConsignmentStatus,
  CreateAgriConsignmentDto,
} from '@ecoride/contracts';

@Injectable()
export class RuralAgriCargoService {
  constructor(
    @InjectRepository(AgriProduceConsignmentEntity)
    private readonly consignmentRepo: Repository<AgriProduceConsignmentEntity>,
  ) {}

  async createConsignment(dto: CreateAgriConsignmentDto): Promise<AgriProduceConsignmentEntity> {
    const netWeightKg = Math.max(0, dto.grossWeightKg - dto.tareWeightKg);
    const ratePerKg = BigInt(dto.ratePerKgPaise);
    const grossProduceValuePaise = BigInt(Math.round(netWeightKg)) * ratePerKg;
    const apmcCessRateBps = 100; // 1% APMC cess
    const apmcCessAmountPaise = (grossProduceValuePaise * BigInt(apmcCessRateBps)) / 10000n;
    const logisticsFeePaise = 25000n + BigInt(Math.round(netWeightKg * 200)); // base 25000 + 200 paise/kg
    const netFarmerPayoutPaise = grossProduceValuePaise - apmcCessAmountPaise - logisticsFeePaise;

    const consignmentCode = `AP-AGRI-${Math.floor(100000 + Math.random() * 900000)}`;

    const consignment = this.consignmentRepo.create({
      consignmentCode,
      farmerId: dto.farmerId,
      farmerName: dto.farmerName,
      farmerAadhaarMasked: dto.farmerAadhaarMasked,
      farmerUpiId: dto.farmerUpiId,
      mandal: dto.mandal,
      district: dto.district,
      produceType: dto.produceType,
      grossWeightKg: dto.grossWeightKg,
      tareWeightKg: dto.tareWeightKg,
      netWeightKg,
      ratePerKgPaise: ratePerKg.toString(),
      grossProduceValuePaise: grossProduceValuePaise.toString(),
      apmcCessRateBps,
      apmcCessAmountPaise: apmcCessAmountPaise.toString(),
      logisticsFeePaise: logisticsFeePaise.toString(),
      netFarmerPayoutPaise: netFarmerPayoutPaise.toString(),
      evCargoVehicleId: dto.evCargoVehicleId,
      captainId: dto.captainId,
      markfedHubId: dto.markfedHubId,
      status: AgriConsignmentStatus.WEIGHED,
    });

    return this.consignmentRepo.save(consignment);
  }

  async updateStatus(id: string, status: AgriConsignmentStatus): Promise<AgriProduceConsignmentEntity> {
    const consignment = await this.getConsignment(id);
    consignment.status = status;
    return this.consignmentRepo.save(consignment);
  }

  async getConsignment(id: string): Promise<AgriProduceConsignmentEntity> {
    const record = await this.consignmentRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Agri consignment ${id} not found`);
    }
    return record;
  }
}

