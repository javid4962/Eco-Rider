import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { Section80eebTaxService } from './section-80eeb-tax.service';
import { TaxRebateCalculationRequest, TaxRebateCertificateRecord } from '@ecoride/contracts';

@Controller('v1/tax-certificates')
export class Section80eebTaxController {
  constructor(private readonly taxService: Section80eebTaxService) {}

  @Post('generate-80eeb')
  async generateCertificate(@Body() body: TaxRebateCalculationRequest): Promise<TaxRebateCertificateRecord> {
    return this.taxService.generateCertificate(body);
  }

  @Get(':certificateNumber')
  async getCertificate(@Param('certificateNumber') certificateNumber: string): Promise<TaxRebateCertificateRecord> {
    return this.taxService.getCertificate(certificateNumber);
  }
}

