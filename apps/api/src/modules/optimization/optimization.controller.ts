import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import {
  OptimizationService,
  RouteOptimizationDto,
  BatteryDegradationSimulationDto,
} from './optimization.service';

@Controller('optimization')
export class OptimizationController {
  constructor(private readonly optimizationService: OptimizationService) {}

  @Get('route')
  @HttpCode(HttpStatus.OK)
  optimizeRoute(
    @Query('originLat') originLat: string,
    @Query('originLng') originLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
    @Query('departureTime') departureTime?: string,
  ): RouteOptimizationDto {
    return this.optimizationService.optimizeCorridorRoute(
      parseFloat(originLat) || 16.502,
      parseFloat(originLng) || 80.648,
      parseFloat(destLat) || 16.5415,
      parseFloat(destLng) || 80.5155,
      departureTime || new Date().toISOString(),
    );
  }

  @Get('battery-health-simulation')
  @HttpCode(HttpStatus.OK)
  simulateBatteryHealth(
    @Query('vehicleId') vehicleId: string,
    @Query('batteryCapacityKwh') capacity?: string,
    @Query('odometerKm') odometer?: string,
    @Query('dcFastChargePercent') dcPercent?: string,
    @Query('ambientTempCelsius') temp?: string,
  ): BatteryDegradationSimulationDto {
    return this.optimizationService.simulateBatteryDegradation(
      vehicleId || 'veh-sim-001',
      capacity ? parseFloat(capacity) : 40.0,
      odometer ? parseFloat(odometer) : 35000,
      dcPercent ? parseFloat(dcPercent) : 60,
      temp ? parseFloat(temp) : 38,
    );
  }
}

