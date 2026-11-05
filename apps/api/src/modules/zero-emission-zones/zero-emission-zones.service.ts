import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ZeroEmissionZoneDto,
  ZezComplianceCheckDto,
  ZezCertificateDto,
} from '@ecoride/contracts';
import { ZeroEmissionZone } from '../../database/entities/zero-emission-zone.entity';
import { ZezComplianceRecord } from '../../database/entities/zez-compliance-record.entity';

@Injectable()
export class ZeroEmissionZonesService {
  constructor(
    @InjectRepository(ZeroEmissionZone)
    private readonly zoneRepo: Repository<ZeroEmissionZone>,
    @InjectRepository(ZezComplianceRecord)
    private readonly recordRepo: Repository<ZezComplianceRecord>,
  ) {}

  async checkCompliance(dto: ZezComplianceCheckDto): Promise<ZezCertificateDto> {
    const zone = await this.zoneRepo.findOne({ where: { zoneCode: dto.zoneCode } });
    if (!zone) {
      throw new NotFoundException(`Zero-emission zone ${dto.zoneCode} not found`);
    }

    let authorizedAccess = true;
    let penaltyChargedPaise = 0;

    if (!dto.isElectric && zone.enforceBevOnly) {
      authorizedAccess = false;
      penaltyChargedPaise = zone.activePenaltyPaiseForIce;
    } else {
      zone.totalBevCrossingsToday += 1;
      await this.zoneRepo.save(zone);
    }

    const certificateNumber = `ZEZ-CERT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const record = this.recordRepo.create({
      certificateNumber,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      zoneCode: dto.zoneCode,
      authorizedAccess,
      penaltyChargedPaise,
    });
    const saved = await this.recordRepo.save(record);

    return {
      certificateNumber: saved.certificateNumber,
      vehicleRegistrationNumber: saved.vehicleRegistrationNumber,
      zoneCode: saved.zoneCode,
      authorizedAccess: saved.authorizedAccess,
      penaltyChargedPaise: saved.penaltyChargedPaise,
      issuedAt: saved.issuedAt ? saved.issuedAt.toISOString() : new Date().toISOString(),
    };
  }

  async registerZone(dto: ZeroEmissionZoneDto): Promise<ZeroEmissionZoneDto> {
    const existing = await this.zoneRepo.findOne({ where: { zoneCode: dto.zoneCode } });
    if (existing) {
      return this.mapToDto(existing);
    }

    const zone = this.zoneRepo.create({
      zoneCode: dto.zoneCode,
      zoneName: dto.zoneName,
      municipality: dto.municipality,
      activePenaltyPaiseForIce: dto.activePenaltyPaiseForIce,
      enforceBevOnly: dto.enforceBevOnly,
      totalBevCrossingsToday: 0,
    });

    const saved = await this.zoneRepo.save(zone);
    return this.mapToDto(saved);
  }

  private mapToDto(z: ZeroEmissionZone): ZeroEmissionZoneDto {
    return {
      zoneCode: z.zoneCode,
      zoneName: z.zoneName,
      municipality: z.municipality,
      activePenaltyPaiseForIce: z.activePenaltyPaiseForIce,
      enforceBevOnly: z.enforceBevOnly,
      totalBevCrossingsToday: z.totalBevCrossingsToday,
    };
  }
}
