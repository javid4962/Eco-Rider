import { Body, Controller, Post } from '@nestjs/common';
import { HighValueCargoLockboxService } from './high-value-cargo-lockbox.service';
import { ProvisionLockboxDto, VerifyLockboxOtpDto } from '@ecoride/contracts';

@Controller('high-value-cargo-lockbox')
export class HighValueCargoLockboxController {
  constructor(private readonly service: HighValueCargoLockboxService) {}

  @Post('provision')
  async provision(@Body() dto: ProvisionLockboxDto) {
    return this.service.provisionLockbox(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyLockboxOtpDto) {
    return this.service.verifyLockboxOtp(dto);
  }
}

