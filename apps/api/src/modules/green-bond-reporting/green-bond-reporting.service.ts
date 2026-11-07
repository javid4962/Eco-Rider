import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { GreenBondAuditReportEntity } from '../../database/entities/green-bond-audit-report.entity';
import {
  GenerateGreenBondReportDto,
  GreenBondAuditStatus,
} from '@ecoride/contracts';

@Injectable()
export class GreenBondReportingService {
  constructor(
    @InjectRepository(GreenBondAuditReportEntity)
    private readonly reportRepo: Repository<GreenBondAuditReportEntity>,
  ) {}

  async generateGreenBondReport(dto: GenerateGreenBondReportDto): Promise<GreenBondAuditReportEntity> {
    const displacedDieselLiters = Math.round((dto.totalCleanKmTraveled / 4.2) * 100) / 100;
    const avoidedCo2EmissionsMetricTons = Math.round(((displacedDieselLiters * 2.68) / 1000.0) * 100) / 100;

    const capex = BigInt(dto.capitalExpenditurePaise);
    const allocated = BigInt(dto.bondProceedsAllocatedPaise);
    const complianceRatioBps = Number((allocated * 10000n) / (capex > 0n ? capex : 1n));

    const hashPayload = `${dto.reportingPeriod}:${dto.bondSeriesId}:${dto.totalCleanKmTraveled}:${avoidedCo2EmissionsMetricTons}`;
    const tamperProofCertificateSha256 = crypto
      .createHash('sha256')
      .update(hashPayload)
      .digest('hex');

    const report = this.reportRepo.create({
      reportingPeriod: dto.reportingPeriod,
      bondSeriesId: dto.bondSeriesId,
      totalCleanKmTraveled: dto.totalCleanKmTraveled,
      totalKwhConsumed: dto.totalKwhConsumed,
      solarWindSharePercent: dto.solarWindSharePercent,
      displacedDieselLiters,
      avoidedCo2EmissionsMetricTons,
      greenJobsGeneratedCount: dto.greenJobsGeneratedCount,
      capitalExpenditurePaise: capex.toString(),
      bondProceedsAllocatedPaise: allocated.toString(),
      complianceRatioBps,
      tamperProofCertificateSha256,
      status: GreenBondAuditStatus.CAG_AUDITED,
    });

    return this.reportRepo.save(report);
  }

  async getReport(id: string): Promise<GreenBondAuditReportEntity> {
    const record = await this.reportRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Green bond audit report ${id} not found`);
    }
    return record;
  }
}
