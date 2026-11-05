import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CaptainPensionService } from './captain-pension.service';
import {
  CaptainPensionAccountDto,
  EnrollPensionDto,
  RecordPensionDeductionDto,
} from '@ecoride/contracts';

@Controller('captain-pension')
export class CaptainPensionController {
  constructor(private readonly pensionService: CaptainPensionService) {}

  @Post('enroll')
  @HttpCode(HttpStatus.CREATED)
  enrollPension(@Body() dto: EnrollPensionDto): Promise<CaptainPensionAccountDto> {
    return this.pensionService.enrollPension(dto);
  }

  @Post('deduct')
  @HttpCode(HttpStatus.OK)
  recordDeduction(@Body() dto: RecordPensionDeductionDto): Promise<CaptainPensionAccountDto> {
    return this.pensionService.recordDeduction(dto);
  }
}
