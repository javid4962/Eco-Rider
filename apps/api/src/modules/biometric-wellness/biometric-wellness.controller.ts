import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BiometricWellnessService } from './biometric-wellness.service';
import {
  CaptainWellnessScreeningDto,
  RecordWellnessCheckDto,
} from '@ecoride/contracts';

@Controller('biometric-wellness')
export class BiometricWellnessController {
  constructor(private readonly wellnessService: BiometricWellnessService) {}

  @Post('screenings')
  @HttpCode(HttpStatus.CREATED)
  recordScreening(@Body() dto: RecordWellnessCheckDto): Promise<CaptainWellnessScreeningDto> {
    return this.wellnessService.recordScreening(dto);
  }
}

