import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { RegulatoryService } from './regulatory.service';
import { ApStaComplianceSummaryDto, RegulatoryFeedFilterDto } from '@ecoride/contracts';

@Controller('regulatory')
export class RegulatoryController {
  constructor(private readonly regulatoryService: RegulatoryService) {}

  @Get('ap-sta/manifest')
  @HttpCode(HttpStatus.OK)
  getManifest(@Query() filter: RegulatoryFeedFilterDto): Promise<ApStaComplianceSummaryDto> {
    return this.regulatoryService.getComplianceSummary(filter);
  }
}

