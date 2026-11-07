import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { TaxRebateCertificateEntity } from '../../database/entities/tax-rebate-certificate.entity';
import {
  TaxRebateCalculationRequest,
  TaxRebateCertificateRecord,
} from '@ecoride/contracts';

@Injectable()
export class Section80eebTaxService {
  constructor(
    @InjectRepository(TaxRebateCertificateEntity)
    private readonly certRepo: Repository<TaxRebateCertificateEntity>,
  ) {}

  async generateCertificate(req: TaxRebateCalculationRequest): Promise<TaxRebateCertificateRecord> {
    if (!req.taxpayerPan || !req.vehicleVin) {
      throw new BadRequestException('taxpayerPan and vehicleVin are required');
    }
    if (req.annualLoanInterestPaidPaise < 0) {
      throw new BadRequestException('annualLoanInterestPaidPaise cannot be negative');
    }

    // Maximum annual deduction under Section 80EEB is ₹1,50,000 (15,000,000 paise)
    const maxSection80EebCapPaise = 15000000;
    const eligibleDeductionPaise = Math.min(req.annualLoanInterestPaidPaise, maxSection80EebCapPaise);

    const certificateNumber = `80EEB-${req.financialYear}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const qrVerificationUrl = `https://portal.ecoride.ap.gov.in/verify-tax/80eeb/${certificateNumber}`;

    const cert = this.certRepo.create({
      certificateNumber,
      taxpayerPan: req.taxpayerPan.toUpperCase(),
      applicantType: req.applicantType,
      vehicleVin: req.vehicleVin,
      financialYear: req.financialYear,
      eligibleDeductionPaise,
      qrVerificationUrl,
    });

    const saved = await this.certRepo.save(cert);

    return {
      id: saved.id,
      certificateNumber: saved.certificateNumber,
      taxpayerPan: saved.taxpayerPan,
      applicantType: saved.applicantType,
      vehicleVin: saved.vehicleVin,
      financialYear: saved.financialYear,
      eligibleDeductionPaise: Number(saved.eligibleDeductionPaise),
      qrVerificationUrl: saved.qrVerificationUrl,
      issuedAt: saved.issuedAt ? saved.issuedAt.toISOString() : new Date().toISOString(),
    };
  }

  async getCertificate(certificateNumber: string): Promise<TaxRebateCertificateRecord> {
    const cert = await this.certRepo.findOne({ where: { certificateNumber } });
    if (!cert) {
      throw new NotFoundException(`Tax certificate ${certificateNumber} not found`);
    }

    return {
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      taxpayerPan: cert.taxpayerPan,
      applicantType: cert.applicantType,
      vehicleVin: cert.vehicleVin,
      financialYear: cert.financialYear,
      eligibleDeductionPaise: Number(cert.eligibleDeductionPaise),
      qrVerificationUrl: cert.qrVerificationUrl,
      issuedAt: cert.issuedAt ? cert.issuedAt.toISOString() : new Date().toISOString(),
    };
  }
}

