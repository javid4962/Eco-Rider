import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxRebateCertificateEntity } from '../../database/entities/tax-rebate-certificate.entity';
import { Section80eebTaxService } from './section-80eeb-tax.service';
import { Section80eebTaxController } from './section-80eeb-tax.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaxRebateCertificateEntity])],
  controllers: [Section80eebTaxController],
  providers: [Section80eebTaxService],
  exports: [Section80eebTaxService],
})
export class Section80eebTaxModule {}

