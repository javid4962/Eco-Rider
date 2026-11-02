import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import {
  AddressSuggestionsQueryDto,
  ReverseGeocodeDto,
  RouteCalculationDto,
  SimulateFaultDto,
  ValidateCoordinatesDto,
} from './dto';

@ApiTags('Maps, Geocoding & Route Engine (EV-032)')
@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('suggestions')
  @ApiOperation({
    summary: 'Address autocompletion suggestions matching AP landmarks and street corridors',
    description:
      'Provides fast, bounded address suggestions with LRU caching and offline fallback resilience.',
  })
  @ApiResponse({ status: 200, description: 'Address suggestions response' })
  async suggestAddresses(@Query() queryDto: AddressSuggestionsQueryDto) {
    return this.mapsService.suggestAddresses(queryDto);
  }

  @Post('reverse-geocode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reverse geocode GPS coordinates to municipal landmark and address',
    description:
      'Resolves AP urban landmarks or formatted municipal coordinates with guaranteed timeout bounds.',
  })
  @ApiResponse({ status: 200, description: 'Reverse geocoding response' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async reverseGeocode(@Body() dto: ReverseGeocodeDto) {
    return this.mapsService.reverseGeocode(dto);
  }

  @Post('route')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate route distance, duration, ETA, and EV battery consumption',
    description:
      'Computes road winding distance, urban driving duration, and EV energy consumption with offline fallback protection.',
  })
  @ApiResponse({ status: 200, description: 'Route calculation details' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async calculateRoute(@Body() dto: RouteCalculationDto) {
    return this.mapsService.calculateRoute(dto);
  }

  @Post('validate-coordinates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate GPS coordinates and Andhra Pradesh territorial inclusion',
    description:
      'Validates mathematical bounds (-90 to +90, -180 to +180) and regional Andhra Pradesh envelope.',
  })
  @ApiResponse({ status: 200, description: 'Validation evaluation result' })
  validateCoordinates(@Body() dto: ValidateCoordinatesDto) {
    return this.mapsService.validateCoordinates(dto);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get maps provider health, bounded cache metrics, and active simulation mode',
  })
  @ApiResponse({ status: 200, description: 'Maps provider status' })
  getStatus() {
    return this.mapsService.getStatus();
  }

  @Post('simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Test/Operator endpoint: Inject simulated upstream faults (TIMEOUT, DOWNTIME, DEGRADED, RATE_LIMITED)',
  })
  @ApiResponse({ status: 200, description: 'Simulation mode applied successfully' })
  simulateFault(@Body() dto: SimulateFaultDto) {
    this.mapsService.setSimulationMode(dto.simulationMode, dto.delayMs);
    return {
      message: `Maps provider simulation mode updated to '${dto.simulationMode}'`,
      status: this.mapsService.getStatus(),
    };
  }

  @Post('cache/clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear in-memory maps cache and reset cache metrics',
  })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  clearCache() {
    this.mapsService.clearCache();
    return {
      message: 'Maps provider cache cleared successfully',
      status: this.mapsService.getStatus(),
    };
  }
}
