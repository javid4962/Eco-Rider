import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ChargingService } from './charging.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  ChargingConnectorType,
  ChargingStationDto,
  NearbyChargerQueryDto,
  CreateChargingReservationDto,
  ChargingReservationDto,
  CompleteChargingSessionDto,
  BatteryTelemetryReportDto,
  BatteryTelemetryResponseDto,
} from '@ecoride/contracts';

@Controller('charging')
export class ChargingController {
  constructor(private readonly chargingService: ChargingService) {}

  @Get('stations')
  findStations(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('connectorType') connectorType?: ChargingConnectorType,
    @Query('minPowerKw') minPowerKw?: string,
  ): Promise<ChargingStationDto[]> {
    const query: NearbyChargerQueryDto = {
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      connectorType,
      minPowerKw: minPowerKw ? parseInt(minPowerKw, 10) : undefined,
    };
    return this.chargingService.findNearbyStations(query);
  }

  @Get('stations/:id')
  getStation(@Param('id', ParseUUIDPipe) id: string): Promise<ChargingStationDto> {
    return this.chargingService.getStation(id);
  }

  @Post('reservations')
  @HttpCode(HttpStatus.CREATED)
  reserveSlot(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: CreateChargingReservationDto,
  ): Promise<ChargingReservationDto> {
    return this.chargingService.reserveSlot(actor.id, dto);
  }

  @Post('telemetry')
  @HttpCode(HttpStatus.OK)
  reportTelemetry(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: BatteryTelemetryReportDto,
  ): Promise<BatteryTelemetryResponseDto> {
    return this.chargingService.reportBatteryTelemetry(actor.id, dto);
  }

  @Post('sessions/complete')
  @HttpCode(HttpStatus.OK)
  completeSession(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: CompleteChargingSessionDto,
  ): Promise<ChargingReservationDto> {
    return this.chargingService.completeChargingSession(actor.id, dto);
  }
}
