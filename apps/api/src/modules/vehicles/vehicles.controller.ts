import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleTelemetryDto,
  VerifyVehicleDto,
  VehiclesPaginationDto,
  ValidateVehicleOperationDto,
} from './dto';

@ApiTags('Electric Vehicles & Compliance')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register a new electric vehicle (EV-Only)',
    description:
      'Registers a verified Battery Electric Vehicle (BEV). Strictly validates electric propulsion server-side; non-electric propulsion (Petrol, Diesel, CNG, Hybrid) is immediately rejected with HTTP 400 Bad Request.',
  })
  @ApiResponse({ status: 201, description: 'Electric vehicle registered successfully' })
  @ApiResponse({
    status: 400,
    description: 'Non-electric propulsion rejected or seating capacity exceeded',
  })
  @ApiResponse({
    status: 409,
    description: 'Vehicle with registration number already exists',
  })
  async createVehicle(@CurrentActor() actor: CurrentActorPayload, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.createVehicle(actor, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List electric vehicles',
    description:
      'Lists registered electric vehicles with pagination and filtering by category, city, verification status, and owner.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of electric vehicles' })
  async listVehicles(@Query() query: VehiclesPaginationDto) {
    return this.vehiclesService.listVehicles(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get vehicle details',
    description:
      'Retrieves single vehicle details including current SoC, rated range, roadworthiness status, and insurance/permit details.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle details retrieved' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getVehicle(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.getVehicle(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update vehicle record',
    description:
      'Updates vehicle metadata, battery capacity, or compliance numbers. Strictly rejects any attempt to change propulsion to non-electric.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 400, description: 'Non-electric propulsion update attempt rejected' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Insufficient permissions to manage vehicle',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async updateVehicle(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.updateVehicle(actor, id, dto);
  }

  @Post(':id/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify or reject vehicle EV compliance status',
    description:
      'Allows platform operators and fleet administrators to verify green plate registration, insurance, and fitness certificates.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle verification status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: Operator or Fleet scope required' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async verifyVehicle(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyVehicleDto,
  ) {
    return this.vehiclesService.verifyVehicle(actor, id, dto);
  }

  @Post(':id/telemetry')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update battery SoC and range telemetry',
    description:
      'Ingests real-time State of Charge (0-100%) and updates telemetry device ping timestamps.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Telemetry updated successfully' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async updateTelemetry(@Param('id', ParseUUIDPipe) id: string, @Body() dto: VehicleTelemetryDto) {
    return this.vehiclesService.updateTelemetry(id, dto);
  }

  @Get(':id/compliance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Inspect real-time regulatory compliance breakdown',
    description:
      'Evaluates commercial insurance, AP green plate verification, transport fitness certificate, and commercial permit expiry dates.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Compliance breakdown calculated' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getCompliance(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.getCompliance(id);
  }

  @Post(':id/validate-operation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate vehicle operational readiness for dispatch / booking (EV-028)',
    description:
      'Asserts that requested seats do not exceed legal passenger capacity (accounting for driver separately), verifies service class/city matching, and ensures green-plate registration is present.',
  })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  @ApiResponse({
    status: 200,
    description: 'Operational validation completed with capacity breakdown and blockers (if any)',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async validateOperation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidateVehicleOperationDto,
  ) {
    return this.vehiclesService.validateVehicleOperation(id, dto);
  }
}
