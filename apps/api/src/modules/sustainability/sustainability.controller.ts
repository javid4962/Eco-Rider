import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SustainabilityService } from './sustainability.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CarbonSavingsCalculation,
  GreenCertificateDto,
  CorporateEsgReportDto,
} from '@ecoride/contracts';

@Controller('sustainability')
export class SustainabilityController {
  constructor(private readonly sustainabilityService: SustainabilityService) {}

  @Get('calculate')
  @HttpCode(HttpStatus.OK)
  calculateSavings(
    @Query('distanceKm') distanceKm: string,
    @Query('vehicleCategory') vehicleCategory?: string,
  ): CarbonSavingsCalculation {
    return this.sustainabilityService.calculateCarbonSavings(
      parseFloat(distanceKm) || 10,
      vehicleCategory || '2W',
    );
  }

  @Post('certificates/issue')
  @HttpCode(HttpStatus.CREATED)
  issueCertificate(
    @CurrentActor() actor: CurrentActorPayload,
    @Body()
    body: {
      recipientType?: 'RIDER' | 'CAPTAIN' | 'CORPORATE';
      recipientId?: string;
      recipientName?: string;
    },
  ): Promise<GreenCertificateDto> {
    const type = body.recipientType || 'RIDER';
    const id = body.recipientId || actor.id;
    const name = body.recipientName || 'EcoRide User';
    return this.sustainabilityService.issueGreenCertificate(type, id, name);
  }

  @Get('certificates/:certificateNumber')
  @HttpCode(HttpStatus.OK)
  verifyCertificate(
    @Param('certificateNumber') certificateNumber: string,
  ): Promise<GreenCertificateDto> {
    return this.sustainabilityService.verifyCertificate(certificateNumber);
  }

  @Get('esg/corporate-report')
  @HttpCode(HttpStatus.OK)
  getCorporateEsgReport(
    @Query('corporateAccountId') corporateAccountId: string,
    @Query('companyName') companyName: string,
    @Query('reportingPeriod') reportingPeriod?: string,
  ): Promise<CorporateEsgReportDto> {
    return this.sustainabilityService.getCorporateEsgReport(
      corporateAccountId,
      companyName || 'Corporate Partner',
      reportingPeriod,
    );
  }
}

