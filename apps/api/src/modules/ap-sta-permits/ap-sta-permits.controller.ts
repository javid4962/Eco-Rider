import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApStaPermitsService } from './ap-sta-permits.service';
import {
  DigitalPermitRecordDto,
  RenewPermitDto,
  PermitRenewalResult,
} from '@ecoride/contracts';
import { DigitalPermitRecord } from '../../database/entities/digital-permit-record.entity';

@Controller('ap-sta-permits')
export class ApStaPermitsController {
  constructor(private readonly permitService: ApStaPermitsService) {}

  @Post('issue')
  async issuePermit(@Body() dto: DigitalPermitRecordDto): Promise<DigitalPermitRecord> {
    return await this.permitService.issuePermit(dto);
  }

  @Get(':permitNumber/compliance')
  async checkCompliance(
    @Param('permitNumber') permitNumber: string,
  ): Promise<DigitalPermitRecord> {
    return await this.permitService.checkPermitCompliance(permitNumber);
  }

  @Post('renew')
  async renewPermit(@Body() dto: RenewPermitDto): Promise<PermitRenewalResult> {
    return await this.permitService.renewPermit(dto);
  }
}
