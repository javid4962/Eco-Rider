import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { ZonesService } from './zones.service';
import {
  CreateServiceCityDto,
  CreateServiceZoneDto,
  QueryZonesDto,
  ToggleCategorySwitchDto,
  UpdateServiceCityDto,
  UpdateServiceZoneDto,
  VerifyLocationDto,
} from './dto';

@ApiTags('Service Cities & Authorized Geofences (EV-031)')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post('verify-location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify if GPS location and category are authorized in polygonal geofences',
    description:
      'Evaluates point-in-polygon inclusion, zone operational status, statutory permit expiry, and individual category switches server-side.',
  })
  @ApiResponse({ status: 200, description: 'Location evaluation result' })
  async verifyLocation(@Body() dto: VerifyLocationDto) {
    return this.zonesService.verifyLocation(dto);
  }

  @Get('cities')
  @ApiOperation({ summary: 'List all service cities in Andhra Pradesh' })
  @ApiResponse({ status: 200, description: 'List of configured service cities' })
  async getCities() {
    return this.zonesService.getCities();
  }

  @Get('cities/:code')
  @ApiOperation({ summary: 'Get service city details by code' })
  @ApiParam({ name: 'code', type: 'string', example: 'visakhapatnam' })
  @ApiResponse({ status: 200, description: 'City details' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async getCity(@Param('code') code: string) {
    return this.zonesService.getCity(code);
  }

  @Post('cities')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Operator: Register a new service city with default disabled categories',
  })
  @ApiResponse({ status: 201, description: 'City created successfully' })
  @ApiResponse({ status: 409, description: 'City code already exists' })
  async createCity(@CurrentActor() actor: CurrentActorPayload, @Body() dto: CreateServiceCityDto) {
    return this.zonesService.createCity(actor, dto);
  }

  @Patch('cities/:code')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Operator: Update service city parameters or category switches' })
  @ApiParam({ name: 'code', type: 'string', example: 'visakhapatnam' })
  @ApiResponse({ status: 200, description: 'City updated successfully' })
  async updateCity(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('code') code: string,
    @Body() dto: UpdateServiceCityDto,
  ) {
    return this.zonesService.updateCity(actor, code, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List authorized polygonal service zones' })
  @ApiResponse({ status: 200, description: 'List of polygonal service zones' })
  async getZones(@Query() filter: QueryZonesDto) {
    return this.zonesService.getZones(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single polygonal service zone by UUID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Zone UUID' })
  @ApiResponse({ status: 200, description: 'Zone details' })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async getZoneById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.zonesService.getZoneById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Operator: Model a new polygonal service zone with PostGIS boundary',
    description:
      'Creates a polygonal geofence. By default, all real mobility categories are disabled.',
  })
  @ApiResponse({ status: 201, description: 'Zone created successfully' })
  @ApiResponse({ status: 409, description: 'Zone code already exists' })
  async createZone(@CurrentActor() actor: CurrentActorPayload, @Body() dto: CreateServiceZoneDto) {
    return this.zonesService.createZone(actor, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Operator: Update polygonal zone, boundary, or operational status' })
  @ApiParam({ name: 'id', type: 'string', description: 'Zone UUID' })
  @ApiResponse({ status: 200, description: 'Zone updated successfully' })
  async updateZone(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateServiceZoneDto,
  ) {
    return this.zonesService.updateZone(actor, id, dto);
  }

  @Patch(':id/category-switch')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Operator: Toggle individual service category switch for a zone',
    description:
      'Enables or disables a specific mobility category with an audited statutory evidence reference.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Zone UUID' })
  @ApiResponse({ status: 200, description: 'Category switch updated' })
  async toggleCategorySwitch(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ToggleCategorySwitchDto,
  ) {
    return this.zonesService.toggleCategorySwitch(actor, id, dto);
  }
}
