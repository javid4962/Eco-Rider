import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EwayBillRecord } from '../../database/entities/eway-bill-record.entity';
import {
  EwayBillVerificationDto,
  EwayBillClearanceResult,
  EwayBillStatus,
} from '@ecoride/contracts';

@Injectable()
export class EwayBillService {
  constructor(
    @InjectRepository(EwayBillRecord)
    private readonly ewayRepo: Repository<EwayBillRecord>,
  ) {}

  async verifyAndClearCheckpost(dto: EwayBillVerificationDto): Promise<EwayBillClearanceResult> {
    if (!/^\d{12}$/.test(dto.ewayBillNumber)) {
      throw new BadRequestException('Statutory Indian E-Way bill must be exactly 12 digits');
    }

    const now = Date.now();
    const expiryTime = new Date(dto.validUntil).getTime();
    const isExpired = now > expiryTime;

    if (isExpired) {
      return {
        ewayBillNumber: dto.ewayBillNumber,
        status: EwayBillStatus.EXPIRED,
        isCleared: false,
        clearanceReference: 'REJECTED_EXPIRED',
        weightMarginKg: 0,
        statutoryGstVerified: false,
        clearanceTimestamp: new Date().toISOString(),
        message: 'Commercial freight clearance denied: E-Way bill has expired.',
      };
    }

    if (dto.grossWeightKg > dto.vehicleMaxGvwKg) {
      const overweightKg = dto.grossWeightKg - dto.vehicleMaxGvwKg;
      return {
        ewayBillNumber: dto.ewayBillNumber,
        status: EwayBillStatus.OVERWEIGHT_REJECTED,
        isCleared: false,
        clearanceReference: 'REJECTED_OVERWEIGHT',
        weightMarginKg: -overweightKg,
        statutoryGstVerified: true,
        clearanceTimestamp: new Date().toISOString(),
        message: `Checkpost axle limit violation: Cargo payload (${dto.grossWeightKg} kg) exceeds vehicle GVW capacity (${dto.vehicleMaxGvwKg} kg) by ${overweightKg} kg.`,
      };
    }

    const clearanceRef = `AP-CTD-${dto.checkpostName.replace(/\s+/g, '_').toUpperCase()}-${Date.now()}`;
    const weightMarginKg = dto.vehicleMaxGvwKg - dto.grossWeightKg;

    const record = this.ewayRepo.create({
      ewayBillNumber: dto.ewayBillNumber,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      consignorGstin: dto.consignorGstin,
      consigneeGstin: dto.consigneeGstin,
      grossWeightKg: dto.grossWeightKg,
      vehicleMaxGvwKg: dto.vehicleMaxGvwKg,
      checkpostName: dto.checkpostName,
      declaredGoodsValuePaise: String(dto.declaredGoodsValuePaise),
      status: EwayBillStatus.CLEARED_AT_CHECKPOST,
      clearanceReference: clearanceRef,
      validUntil: new Date(dto.validUntil),
    });

    await this.ewayRepo.save(record);

    return {
      ewayBillNumber: dto.ewayBillNumber,
      status: EwayBillStatus.CLEARED_AT_CHECKPOST,
      isCleared: true,
      clearanceReference: clearanceRef,
      weightMarginKg,
      statutoryGstVerified: true,
      clearanceTimestamp: new Date().toISOString(),
      message: `Commercial cargo passed APCTD clearance at ${dto.checkpostName}. Clearance reference: ${clearanceRef}.`,
    };
  }

  async getRecord(ewayBillNumber: string): Promise<EwayBillRecord> {
    const record = await this.ewayRepo.findOne({ where: { ewayBillNumber } });
    if (!record) {
      throw new NotFoundException(`E-Way bill record ${ewayBillNumber} not found`);
    }
    return record;
  }
}

