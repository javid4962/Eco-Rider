import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DepotLoadBalancingService } from './depot-load-balancing.service';
import {
  DepotLoadStatusDto,
  BalanceDepotLoadRequestDto,
} from '@ecoride/contracts';

@Controller('depot-load-balancing')
export class DepotLoadBalancingController {
  constructor(private readonly balancingService: DepotLoadBalancingService) {}

  @Post('balance')
  @HttpCode(HttpStatus.OK)
  balanceDepotLoad(@Body() dto: BalanceDepotLoadRequestDto): Promise<DepotLoadStatusDto> {
    return this.balancingService.balanceDepotLoad(dto);
  }
}
