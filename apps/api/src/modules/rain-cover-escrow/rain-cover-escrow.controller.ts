import { Controller, Post, Body } from '@nestjs/common';
import { RainCoverEscrowService } from './rain-cover-escrow.service';
import {
  IssueRainCoverRequest,
  ReturnRainCoverRequest,
  RainCoverEscrowSessionRecord,
} from '@ecoride/contracts';

@Controller('v1/equipment-rental/rain-cover')
export class RainCoverEscrowController {
  constructor(private readonly escrowService: RainCoverEscrowService) {}

  @Post('issue')
  async issueRainCover(@Body() body: IssueRainCoverRequest): Promise<RainCoverEscrowSessionRecord> {
    return this.escrowService.issueRainCover(body);
  }

  @Post('return')
  async returnRainCover(@Body() body: ReturnRainCoverRequest): Promise<RainCoverEscrowSessionRecord> {
    return this.escrowService.returnRainCover(body);
  }
}
