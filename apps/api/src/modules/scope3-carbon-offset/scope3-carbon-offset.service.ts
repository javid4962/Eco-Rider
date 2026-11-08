import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Scope3CarbonCertificateEntity } from '../../database/entities/scope3-carbon-certificate.entity';
import {
  GenerateScope3CertificateDto,
  OffsetVerificationStatus,
} from '@ecoride/contracts';

@Injectable()
export class Scope3CarbonOffsetService {
  constructor(
    @InjectRepository(Scope3CarbonCertificateEntity)
    private readonly certRepo: Repository<Scope3CarbonCertificateEntity>,
  ) {}

  async generateCertificate(dto: GenerateScope3CertificateDto): Promise<Scope3CarbonCertificateEntity> {
    const factorKgPerKm = dto.isCargoMovement ? 0.420 : 0.162;
    const avoidedCo2Kg = Math.round(dto.totalElectricKm * factorKgPerKm * 100) / 100;
    const displacedDieselLiters = Math.round((avoidedCo2Kg / 2.68) * 100) / 100;

    const rawPayload = `${dto.corporateAccountId}|${dto.reportingMonth}|${dto.standard}|${avoidedCo2Kg}|${displacedDieselLiters}`;
    const certificateHashSha256 = crypto
      .createHash('sha256')
      .update(rawPayload)
      .digest('hex');

    const record = this.certRepo.create({
      corporateAccountId: dto.corporateAccountId,
      reportingMonth: dto.reportingMonth,
      standard: dto.standard,
      totalElectricKm: dto.totalElectricKm,
      avoidedCo2Kg,
      displacedDieselLiters,
      verificationStatus: OffsetVerificationStatus.CERTIFIED,
      certificateHashSha256,
      certifiedAt: new Date(),
    });

    return this.certRepo.save(record);
  }

  async getCertificate(id: string): Promise<Scope3CarbonCertificateEntity> {
    const record = await this.certRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Scope 3 carbon certificate ${id} not found`);
    }
    return record;
  }
}
