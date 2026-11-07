import { Body, Controller, Post } from '@nestjs/common';
import { MicroMobilityBountyService } from './micro-mobility-bounty.service';
import {
  VerifyDockingLocationDto,
  ClaimBountyDto,
  CompleteBountyRedockDto,
} from '@ecoride/contracts';

@Controller('micro-mobility-bounty')
export class MicroMobilityBountyController {
  constructor(private readonly service: MicroMobilityBountyService) {}

  @Post('verify-docking')
  async verifyDocking(@Body() dto: VerifyDockingLocationDto) {
    return this.service.validateDockingLocation(dto);
  }

  @Post('claim')
  async claimBounty(@Body() dto: ClaimBountyDto) {
    return this.service.claimBounty(dto);
  }

  @Post('complete-redock')
  async completeRedock(@Body() dto: CompleteBountyRedockDto) {
    return this.service.completeBountyRedock(dto);
  }
}
