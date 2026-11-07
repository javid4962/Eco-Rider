import { Body, Controller, Post } from '@nestjs/common';
import { TransitTurnstileService } from './transit-turnstile.service';
import { GenerateTransitQrRequestDto, ValidateTurnstileScanDto } from '@ecoride/contracts';

@Controller('transit-turnstile')
export class TransitTurnstileController {
  constructor(private readonly service: TransitTurnstileService) {}

  @Post('generate-qr')
  async generateQr(@Body() dto: GenerateTransitQrRequestDto) {
    return this.service.generateTransitQr(dto);
  }

  @Post('validate-scan')
  async validateScan(@Body() dto: ValidateTurnstileScanDto) {
    return this.service.validateTurnstileScan(dto);
  }
}

