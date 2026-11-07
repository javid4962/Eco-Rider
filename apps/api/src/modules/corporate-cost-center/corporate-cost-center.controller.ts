import { Body, Controller, Post } from '@nestjs/common';
import { CorporateCostCenterService } from './corporate-cost-center.service';
import { CreateCostCenterDto, AuthorizeCorporateRideDto } from '@ecoride/contracts';

@Controller('corporate-cost-center')
export class CorporateCostCenterController {
  constructor(private readonly service: CorporateCostCenterService) {}

  @Post('create')
  async create(@Body() dto: CreateCostCenterDto) {
    return this.service.createCostCenter(dto);
  }

  @Post('authorize-ride')
  async authorizeRide(@Body() dto: AuthorizeCorporateRideDto) {
    return this.service.authorizeRide(dto);
  }
}
