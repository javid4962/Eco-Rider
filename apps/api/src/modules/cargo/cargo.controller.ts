import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CargoService } from './cargo.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CargoVehicleTier,
  CreateCargoShipmentDto,
  DeliverCargoStopDto,
  SettleCodDto,
  CargoPricingCalculation,
  CargoShipmentDto,
} from '@ecoride/contracts';

@Controller('cargo')
export class CargoController {
  constructor(private readonly cargoService: CargoService) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  calculateQuote(
    @Body()
    body: {
      tier: CargoVehicleTier;
      packageWeightKg: number;
      stops: { latitude: number; longitude: number }[];
      requiresHelper?: boolean;
    },
  ): CargoPricingCalculation {
    return this.cargoService.calculateCargoFare(
      body.tier,
      body.packageWeightKg,
      body.stops,
      body.requiresHelper,
    );
  }

  @Post('shipments')
  @HttpCode(HttpStatus.CREATED)
  createShipment(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: CreateCargoShipmentDto,
  ): Promise<CargoShipmentDto> {
    return this.cargoService.createShipment(actor, dto);
  }

  @Get('shipments/:id')
  getShipment(@Param('id', ParseUUIDPipe) id: string): Promise<CargoShipmentDto> {
    return this.cargoService.getShipment(id);
  }

  @Get('track/:trackingNumber')
  trackShipment(@Param('trackingNumber') trackingNumber: string): Promise<CargoShipmentDto> {
    return this.cargoService.trackShipment(trackingNumber);
  }

  @Post('shipments/:id/assign')
  assignShipment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { captainId: string; vehicleId: string },
  ): Promise<CargoShipmentDto> {
    return this.cargoService.assignShipment(id, body.captainId, body.vehicleId);
  }

  @Post('shipments/:id/pickup/:stopId')
  completePickup(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @CurrentActor() actor: CurrentActorPayload,
  ): Promise<CargoShipmentDto> {
    return this.cargoService.completePickup(id, stopId, actor.id);
  }

  @Post('shipments/:id/deliver/:stopId')
  deliverStop(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: DeliverCargoStopDto,
  ): Promise<CargoShipmentDto> {
    return this.cargoService.deliverStop(id, stopId, actor.id, dto);
  }

  @Post('cod/settle')
  settleCod(@Body() dto: SettleCodDto) {
    return this.cargoService.settleCodToMerchant(dto);
  }
}
