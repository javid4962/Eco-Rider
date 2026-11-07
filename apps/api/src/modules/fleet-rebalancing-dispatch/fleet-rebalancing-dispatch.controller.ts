import { Controller, Post, Body, Param } from '@nestjs/common';
import { FleetRebalancingDispatchService } from './fleet-rebalancing-dispatch.service';
import { DistrictZoneDemandEstimate, MultiDistrictRepositioningOrder } from '@ecoride/contracts';

@Controller('v1/fleet-rebalancing')
export class FleetRebalancingDispatchController {
  constructor(private readonly rebalancingService: FleetRebalancingDispatchService) {}

  @Post('generate-orders')
  async generateRebalancingOrders(
    @Body() body: DistrictZoneDemandEstimate[],
  ): Promise<MultiDistrictRepositioningOrder[]> {
    return this.rebalancingService.generateRebalancingOrders(body);
  }

  @Post('orders/:orderId/accept')
  async acceptOrder(
    @Param('orderId') orderId: string,
    @Body() body: { captainId: string; vehicleId: string },
  ): Promise<MultiDistrictRepositioningOrder> {
    return this.rebalancingService.acceptOrder(orderId, body.captainId, body.vehicleId);
  }

  @Post('orders/:orderId/complete')
  async completeOrder(@Param('orderId') orderId: string): Promise<MultiDistrictRepositioningOrder> {
    return this.rebalancingService.completeOrder(orderId);
  }
}

