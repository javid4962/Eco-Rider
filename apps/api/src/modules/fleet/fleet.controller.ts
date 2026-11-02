import {
  Controller,
  Get,
  Post,
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
import { FleetService } from './fleet.service';
import {
  CreateFleetOrganizationDto,
  AssignFleetDriverDto,
  StartFleetShiftDto,
  EndFleetShiftDto,
  QueryFleetVehiclesDto,
} from './dto';

@ApiTags('Fleet Organizations & Operations (EV-030)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get('organization')
  @ApiOperation({
    summary: 'Get caller’s fleet organization profile and roster summary',
    description: 'Retrieves commercial fleet details, active vehicles count, and driver rosters.',
  })
  @ApiResponse({ status: 200, description: 'Fleet organization retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No fleet organization found for caller' })
  async getMyOrganization(@CurrentActor() actor: CurrentActorPayload) {
    return this.fleetService.getMyOrganization(actor);
  }

  @Post('organizations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new commercial EV fleet organization',
    description:
      'Creates a commercial fleet organization with tax/RTA registration number and dedicated payout account.',
  })
  @ApiResponse({ status: 201, description: 'Fleet organization registered successfully' })
  @ApiResponse({ status: 409, description: 'Registration number or payout account already exists' })
  async createOrganization(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: CreateFleetOrganizationDto,
  ) {
    return this.fleetService.createOrganization(actor, dto);
  }

  @Get('organizations/:id')
  @ApiOperation({
    summary: 'Get fleet organization by UUID',
    description:
      'Enforces strict cross-fleet tenant check: fleet owners can only access their own.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Fleet Organization UUID' })
  @ApiResponse({ status: 200, description: 'Fleet organization details' })
  @ApiResponse({ status: 403, description: 'Forbidden: cross-fleet access denied' })
  async getOrganizationById(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const org = await this.fleetService.resolveFleetOrganization(actor, id);
    return this.fleetService.getMyOrganization({ ...actor, id: org.ownerId });
  }

  @Get('vehicles')
  @ApiOperation({
    summary: 'List vehicles in caller’s fleet organization',
    description: 'Scoped strictly to caller’s fleet. Prevents cross-fleet vehicle leakage.',
  })
  @ApiResponse({ status: 200, description: 'List of fleet vehicles' })
  async getFleetVehicles(
    @CurrentActor() actor: CurrentActorPayload,
    @Query() query: QueryFleetVehiclesDto,
  ) {
    return this.fleetService.getFleetVehicles(actor, undefined, query);
  }

  @Post('vehicles/:vehicleId/membership')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add/attach vehicle to caller’s fleet organization',
    description: 'Enforces 100% BEV propulsion and single fleet membership.',
  })
  @ApiParam({ name: 'vehicleId', type: 'string', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle successfully added to fleet' })
  @ApiResponse({ status: 409, description: 'Vehicle already belongs to another fleet' })
  async addVehicleToFleet(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ) {
    return this.fleetService.addVehicleToFleet(actor, vehicleId);
  }

  @Post('vehicles/:vehicleId/assign-driver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign or reassign driver to a fleet EV vehicle',
    description:
      'Closes previous assignment, creates new assignment row, updates driver profile, and records reassignment audit event.',
  })
  @ApiParam({ name: 'vehicleId', type: 'string', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Driver assigned to vehicle successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: vehicle belongs to another fleet' })
  @ApiResponse({ status: 422, description: 'Driver is not VERIFIED for passenger operations' })
  async assignDriverToVehicle(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: AssignFleetDriverDto,
  ) {
    return this.fleetService.assignDriverToVehicle(actor, vehicleId, dto);
  }

  @Get('vehicles/:vehicleId/assignment-history')
  @ApiOperation({
    summary: 'Get complete driver assignment and reassignment audit history for a vehicle',
    description: 'Returns chronological assignment history with driver and assigner details.',
  })
  @ApiParam({ name: 'vehicleId', type: 'string', description: 'Vehicle UUID' })
  @ApiResponse({ status: 200, description: 'Vehicle assignment audit trail' })
  async getVehicleAssignmentHistory(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ) {
    return this.fleetService.getVehicleAssignmentHistory(actor, vehicleId);
  }

  @Post('shifts/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start an operational shift for a fleet vehicle and driver',
    description: 'Enforces verified driver status and minimum 15% battery SoC.',
  })
  @ApiResponse({ status: 201, description: 'Fleet shift started successfully' })
  @ApiResponse({ status: 422, description: 'Battery SoC below 15% or driver unverified' })
  async startShift(@CurrentActor() actor: CurrentActorPayload, @Body() dto: StartFleetShiftDto) {
    return this.fleetService.startShift(actor, dto);
  }

  @Post('shifts/:id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End an active fleet shift and record handover telemetry & revenue',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Fleet Shift UUID' })
  @ApiResponse({ status: 200, description: 'Fleet shift ended successfully' })
  async endShift(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: EndFleetShiftDto,
  ) {
    return this.fleetService.endShift(actor, id, dto);
  }

  @Get('shifts')
  @ApiOperation({
    summary: 'List operational shift records for caller’s fleet',
  })
  @ApiResponse({ status: 200, description: 'Fleet shift records' })
  async getFleetShifts(@CurrentActor() actor: CurrentActorPayload) {
    return this.fleetService.getFleetShifts(actor);
  }

  @Get('earnings')
  @ApiOperation({
    summary: 'Get financial earnings summary for caller’s fleet organization',
    description:
      'Scoped strictly to caller’s organization payout account. Prevents cross-fleet visibility.',
  })
  @ApiResponse({ status: 200, description: 'Fleet financial earnings breakdown' })
  async getMyFleetEarnings(@CurrentActor() actor: CurrentActorPayload) {
    return this.fleetService.getFleetEarnings(actor);
  }

  @Get('organizations/:orgId/earnings')
  @ApiOperation({
    summary: 'Operator or Owner: Get financial earnings for specified fleet organization',
    description:
      'Enforces tenant isolation: non-operator fleet owners cannot view another fleet’s earnings.',
  })
  @ApiParam({ name: 'orgId', type: 'string', description: 'Fleet Organization UUID' })
  @ApiResponse({ status: 200, description: 'Fleet earnings breakdown' })
  @ApiResponse({ status: 403, description: 'Forbidden: cross-fleet financial access denied' })
  async getFleetEarningsByOrgId(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('orgId', new ParseUUIDPipe()) orgId: string,
  ) {
    return this.fleetService.getFleetEarnings(actor, orgId);
  }
}
