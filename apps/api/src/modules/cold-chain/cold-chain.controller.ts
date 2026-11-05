import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ColdChainService } from './cold-chain.service';
import {
  ColdChainShipmentDto,
  ColdChainTelemetryPingDto,
  TemperatureExcursionAlertDto,
  ColdChainTemperatureRange,
} from '@ecoride/contracts';

@Controller('cold-chain')
export class ColdChainController {
  constructor(private readonly coldChainService: ColdChainService) {}

  @Post('shipments')
  @HttpCode(HttpStatus.CREATED)
  createShipment(
    @Body()
    body: {
      consignmentId: string;
      vehicleRegistrationNumber: string;
      cargoType: string;
      range: ColdChainTemperatureRange;
    },
  ): Promise<ColdChainShipmentDto> {
    return this.coldChainService.createShipment(
      body.consignmentId,
      body.vehicleRegistrationNumber,
      body.cargoType,
      body.range,
    );
  }

  @Post('telemetry')
  @HttpCode(HttpStatus.OK)
  ingestTelemetry(@Body() dto: ColdChainTelemetryPingDto): Promise<TemperatureExcursionAlertDto | null> {
    return this.coldChainService.ingestTelemetry(dto);
  }
}

