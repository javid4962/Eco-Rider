import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { DigitalPermitRecord } from '../../database/entities/digital-permit-record.entity';
import {
  DigitalPermitRecordDto,
  RenewPermitDto,
  PermitRenewalResult,
  PermitComplianceStatus,
} from '@ecoride/contracts';

@Injectable()
export class ApStaPermitsService {
  constructor(
    @InjectRepository(DigitalPermitRecord)
    private readonly permitRepo: Repository<DigitalPermitRecord>,
  ) {}

  private generateVerificationHash(permitNumber: string, regNumber: string, expiry: string): string {
    return crypto
      .createHash('sha256')
      .update(`AP-STA-PERMIT:${permitNumber}:${regNumber}:${expiry}:BEV_EXEMPT_AP2026`)
      .digest('hex');
  }

  async issuePermit(dto: DigitalPermitRecordDto): Promise<DigitalPermitRecord> {
    if (!dto.pucExempt || !dto.roadTaxExempt) {
      throw new BadRequestException(
        'BEV fleet permits in Andhra Pradesh must be strictly PUC and Road Tax exempt under AP EV Policy 2024-2029',
      );
    }

    const verificationHash = this.generateVerificationHash(
      dto.permitNumber,
      dto.registrationNumber,
      dto.validUntil,
    );

    const permit = this.permitRepo.create({
      permitNumber: dto.permitNumber,
      vehicleId: dto.vehicleId,
      registrationNumber: dto.registrationNumber,
      permitType: dto.permitType,
      rtoOfficeCode: dto.rtoOfficeCode,
      validFrom: new Date(dto.validFrom),
      validUntil: new Date(dto.validUntil),
      pucExempt: true,
      roadTaxExempt: true,
      status: PermitComplianceStatus.COMPLIANT,
      verificationHash,
    });

    return await this.permitRepo.save(permit);
  }

  async checkPermitCompliance(permitNumber: string): Promise<DigitalPermitRecord> {
    const permit = await this.permitRepo.findOne({ where: { permitNumber } });
    if (!permit) {
      throw new NotFoundException(`Permit ${permitNumber} not found`);
    }

    const now = Date.now();
    const expiryTime = new Date(permit.validUntil).getTime();
    const daysRemaining = (expiryTime - now) / (1000 * 60 * 60 * 24);

    if (daysRemaining < 0) {
      permit.status = PermitComplianceStatus.EXPIRED;
    } else if (daysRemaining <= 30) {
      permit.status = PermitComplianceStatus.EXPIRING_SOON;
    } else {
      permit.status = PermitComplianceStatus.COMPLIANT;
    }

    return await this.permitRepo.save(permit);
  }

  async renewPermit(dto: RenewPermitDto): Promise<PermitRenewalResult> {
    const permit = await this.permitRepo.findOne({ where: { permitNumber: dto.permitNumber } });
    if (!permit) {
      throw new NotFoundException(`Permit ${dto.permitNumber} not found`);
    }

    const currentExpiry = new Date(permit.validUntil);
    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + (dto.renewalDurationMonths || 12));

    const newHash = this.generateVerificationHash(
      permit.permitNumber,
      permit.registrationNumber,
      newExpiry.toISOString(),
    );

    permit.validUntil = newExpiry;
    permit.status = PermitComplianceStatus.COMPLIANT;
    permit.verificationHash = newHash;

    await this.permitRepo.save(permit);

    // Statutory AP STA green permit renewal fee: 150,000 paise (₹1,500.00)
    const statutoryFeePaise = 150000;

    return {
      permitNumber: permit.permitNumber,
      status: PermitComplianceStatus.COMPLIANT,
      newValidUntil: newExpiry.toISOString(),
      statutoryFeePaise,
      newVerificationHash: newHash,
      message: `Permit renewed successfully for ${dto.renewalDurationMonths} months under AP-STA online portal.`,
    };
  }
}

