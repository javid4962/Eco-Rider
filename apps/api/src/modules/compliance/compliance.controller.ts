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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { ComplianceService } from './compliance.service';
import { CaptainAvailabilityService } from './captain-availability.service';
import { BatteryDispatchService } from './battery-dispatch.service';
import {
  ToggleDutyDto,
  UpdateComplianceStatusDto,
  ReverifyComplianceDto,
  QueryComplianceWarningsDto,
  RunExpiryScanDto,
  CaptainLocationPingDto,
  UpdateAvailabilityDto,
  QueryAvailableCaptainsDto,
  EvaluateBatteryDispatchDto,
  CaptainBatterySyncDto,
  SelectNearbyCaptainsDto,
} from './dto';
import { PlatformRole } from '@ecoride/contracts';

@ApiTags('Captain Compliance & Duty State')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('captains')
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly captainAvailabilityService: CaptainAvailabilityService,
    private readonly batteryDispatchService: BatteryDispatchService,
  ) {}

  @Get('available')
  @ApiOperation({
    summary: 'Find available, location-fresh captains eligible for dispatch (EV-040)',
    description:
      'Proximity query that strictly filters out stale, offline, charging, maintenance, and low-battery captains.',
  })
  @ApiResponse({ status: 200, description: 'List of dispatch-eligible captains within radius' })
  async findAvailableCaptains(@Query() query: QueryAvailableCaptainsDto) {
    return this.captainAvailabilityService.findAvailableCaptainsForDispatch(query);
  }

  @Post('nearby-eligible')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Select nearby eligible EV captains with fair offer ordering (EV-042)',
    description:
      'Evaluates PostGIS spatial filtering, transient Redis pre-filtering, zone geofence inclusion, BEV roadworthiness, driver KYC verification, location precision (<=50m), and fair ranking.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranked list of nearby eligible candidate captains',
  })
  async selectNearbyCaptainsPost(@Body() dto: SelectNearbyCaptainsDto) {
    return this.captainAvailabilityService.selectNearbyEligibleCaptains(dto);
  }

  @Get('nearby-eligible')
  @ApiOperation({
    summary: 'Query nearby eligible EV captains via GET parameters (EV-042)',
    description:
      'Query version for riders and ops clients to preview nearby available EV captains matching category and location.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ranked list of nearby eligible candidate captains',
  })
  async selectNearbyCaptainsGet(@Query() query: SelectNearbyCaptainsDto) {
    return this.captainAvailabilityService.selectNearbyEligibleCaptains(query);
  }

  @Get('me/availability')
  @ApiOperation({
    summary: 'Get current captain availability status and location freshness (EV-040)',
    description:
      'Returns the captain availability state (OFFLINE, AVAILABLE, RESERVED, ON_TRIP, CHARGING, MAINTENANCE), location coordinates, and dispatch eligibility.',
  })
  @ApiResponse({ status: 200, description: 'Captain availability details' })
  async getMyAvailability(@CurrentActor() actor: CurrentActorPayload) {
    return this.captainAvailabilityService.getAvailability(actor, actor.id);
  }

  @Post('me/availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current captain availability state (EV-040)',
    description:
      'Transitions availability state among OFFLINE, AVAILABLE, RESERVED, ON_TRIP, CHARGING, and MAINTENANCE. When going AVAILABLE, verifies compliance and roadworthiness.',
  })
  @ApiResponse({ status: 200, description: 'Availability state updated successfully' })
  @ApiResponse({ status: 422, description: 'Captain is ineligible to go AVAILABLE' })
  async updateMyAvailability(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.captainAvailabilityService.updateAvailability(actor, actor.id, dto);
  }

  @Post('me/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record authenticated captain GPS location telemetry (EV-040)',
    description:
      'Ingests live location ping, verifies accuracy (<= 50m), updates PostgreSQL spatial index, and refreshes Redis telemetry TTL (30s freshness window).',
  })
  @ApiResponse({ status: 200, description: 'Location telemetry ingested successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates or unacceptable accuracy' })
  async recordMyLocation(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: CaptainLocationPingDto,
  ) {
    return this.captainAvailabilityService.recordLocationPing(actor, actor.id, dto);
  }

  @Get('me/dispatch-eligibility')
  @ApiOperation({
    summary: 'Evaluate captain dispatch offer eligibility (EV-040)',
    description:
      'Validates that captain is AVAILABLE, location is fresh (<= 30s), accuracy is acceptable (<= 50m), and battery SoC is >= 20%. Stale/offline/charging captains return ineligibility reasons.',
  })
  @ApiResponse({ status: 200, description: 'Dispatch offer eligibility audit breakdown' })
  async getMyDispatchEligibility(@CurrentActor() actor: CurrentActorPayload) {
    return this.captainAvailabilityService.getDispatchEligibility(actor, actor.id);
  }

  @Get(':userId/availability')
  @ApiOperation({
    summary: 'Get captain availability by user UUID (EV-040)',
    description: 'Enforces ownership check. Cross-captain access by other clients is forbidden.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Captain user UUID' })
  @ApiResponse({ status: 200, description: 'Captain availability details' })
  @ApiResponse({ status: 403, description: 'Forbidden: cannot view another captain state' })
  async getCaptainAvailability(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.captainAvailabilityService.getAvailability(actor, userId);
  }

  @Post(':userId/availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update captain availability by user UUID (EV-040)',
    description: 'Enforces ownership check. Cross-captain editing by other clients is forbidden.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Captain user UUID' })
  @ApiResponse({ status: 200, description: 'Availability state updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: cannot edit another captain state' })
  async updateCaptainAvailability(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.captainAvailabilityService.updateAvailability(actor, userId, dto);
  }

  @Post(':userId/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record captain location by user UUID (EV-040)',
    description: 'Enforces ownership check. Clients cannot submit location for another captain.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Captain user UUID' })
  @ApiResponse({ status: 200, description: 'Location telemetry ingested successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: cannot edit another captain location' })
  async recordCaptainLocation(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: CaptainLocationPingDto,
  ) {
    return this.captainAvailabilityService.recordLocationPing(actor, userId, dto);
  }

  @Get(':userId/dispatch-eligibility')
  @ApiOperation({
    summary: 'Evaluate captain dispatch offer eligibility by user UUID (EV-040)',
    description: 'Enforces ownership check. Clients cannot inspect another captain eligibility.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Captain user UUID' })
  @ApiResponse({ status: 200, description: 'Dispatch offer eligibility audit breakdown' })
  @ApiResponse({ status: 403, description: 'Forbidden: cross-captain access' })
  async getCaptainDispatchEligibility(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.captainAvailabilityService.getDispatchEligibility(actor, userId);
  }

  @Post('me/dispatch-eligibility/battery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluate current captain EV battery-aware dispatch eligibility for a trip (EV-041)',
    description:
      'Validates battery SoC, telemetry source and freshness, adequate range for pickup + journey + reserve margin + charging contingency, and BEV approval.',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed EV battery dispatch feasibility breakdown and recovery guide',
  })
  async evaluateMyBatteryDispatch(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: EvaluateBatteryDispatchDto,
  ) {
    return this.batteryDispatchService.evaluateDispatchEligibility(
      { ...dto, captainId: actor.id },
      actor,
    );
  }

  @Post(':userId/dispatch-eligibility/battery')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluate captain EV battery-aware dispatch eligibility by user UUID (EV-041)',
    description:
      'Enforces ownership check. Clients cannot inspect another captain battery dispatch feasibility.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Captain user UUID' })
  @ApiResponse({ status: 200, description: 'Detailed EV battery dispatch feasibility breakdown' })
  @ApiResponse({ status: 403, description: 'Forbidden: cross-captain access' })
  async evaluateCaptainBatteryDispatch(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: EvaluateBatteryDispatchDto,
  ) {
    return this.batteryDispatchService.evaluateDispatchEligibility(
      { ...dto, captainId: userId },
      actor,
    );
  }

  @Post('dispatch-eligibility/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluate arbitrary EV battery dispatch eligibility for dispatch engines (EV-041)',
    description:
      'Evaluates battery feasibility for either captainId or vehicleId for given trip coordinates.',
  })
  @ApiResponse({ status: 200, description: 'Evaluation result with distance and energy breakdown' })
  async evaluateGeneralBatteryDispatch(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: EvaluateBatteryDispatchDto,
  ) {
    return this.batteryDispatchService.evaluateDispatchEligibility(dto, actor);
  }

  @Post('me/battery/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync refreshed battery telemetry or report recharge/swap (EV-041 manual recovery)',
    description:
      'Used as part of manual recovery path after depot DC fast charging or battery swap to re-enable dispatch eligibility.',
  })
  @ApiResponse({ status: 200, description: 'Battery telemetry synced successfully' })
  async syncMyBattery(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: CaptainBatterySyncDto,
  ) {
    return this.batteryDispatchService.syncCaptainBattery(actor, actor.id, dto);
  }

  @Post(':userId/battery/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync captain battery telemetry by user UUID (EV-041 manual recovery)',
    description:
      'Enforces ownership check or admin role. Used to update battery state after maintenance or charging.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Captain user UUID' })
  @ApiResponse({ status: 200, description: 'Battery telemetry synced successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: cross-captain access' })
  async syncCaptainBattery(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: CaptainBatterySyncDto,
  ) {
    return this.batteryDispatchService.syncCaptainBattery(actor, userId, dto);
  }

  @Get('me/compliance')
  @ApiOperation({
    summary: 'Get current captain compliance & assignment eligibility status',
    description:
      'Evaluates multi-dimensional assignment eligibility (driver KYC, statutory document validity, EV roadworthiness, battery SoC, and zone permissions).',
  })
  @ApiResponse({
    status: 200,
    description: 'Current captain eligibility details',
  })
  async getMyCompliance(@CurrentActor() actor: CurrentActorPayload) {
    return this.complianceService.getCaptainEligibility(actor, actor.id);
  }

  @Post('me/duty')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle captain duty state (ONLINE / OFFLINE)',
    description:
      'Transitions captain duty state. When switching to ONLINE, strictly verifies that the captain is not suspended, not expired, fully verified, and meets all roadworthiness and zone permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Duty status updated successfully',
  })
  @ApiResponse({
    status: 422,
    description:
      'Captain is not eligible to go online (suspended, expired, unverified, or vehicle unroadworthy)',
  })
  async toggleDuty(@CurrentActor() actor: CurrentActorPayload, @Body() dto: ToggleDutyDto) {
    return this.complianceService.toggleDuty(actor, dto);
  }

  @Get(':userId/compliance')
  @ApiOperation({
    summary: 'Admin/Operator: Inspect captain compliance & assignment eligibility',
    description:
      'Enforces cross-account authorization checks. Permitted for operators and super admins.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Target user ID of the captain' })
  @ApiResponse({ status: 200, description: 'Captain compliance eligibility details' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized cross-account access' })
  async getCaptainCompliance(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.complianceService.getCaptainEligibility(actor, userId);
  }

  @Post(':userId/compliance/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Admin/Operator: Update captain compliance status (SUSPENDED, EXPIRED, VERIFIED, REJECTED)',
    description:
      'Administrative transition. Forces captain OFFLINE if suspended, expired, or rejected.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Target user ID of the captain' })
  @ApiResponse({ status: 200, description: 'Compliance status updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: caller lacks driver:write operational permission',
  })
  async updateComplianceStatus(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateComplianceStatusDto,
  ) {
    return this.complianceService.updateComplianceStatus(actor, userId, dto);
  }

  @Post('scans/run-expiry-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Operator/Internal: Execute scheduled compliance expiry scan',
    description:
      'Scans all verified captains and EV vehicles for statutory expiration against Andhra Pradesh local midnight boundary. Auto-transitions expired records, safely forces duty OFFLINE, and emits advance warning notifications.',
  })
  @ApiResponse({ status: 200, description: 'Compliance expiry scan completed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: caller lacks operator operational permissions',
  })
  async runExpiryScan(@CurrentActor() actor: CurrentActorPayload, @Body() dto: RunExpiryScanDto) {
    if (
      actor.role !== PlatformRole.OPERATOR &&
      actor.role !== PlatformRole.SUPER_ADMIN &&
      actor.role !== PlatformRole.SAFETY_OFFICER &&
      !actor.scopes?.includes('driver:write') &&
      !actor.scopes?.includes('*')
    ) {
      throw new ForbiddenException(
        'Forbidden: Only fleet operators or compliance officers can trigger statutory scans.',
      );
    }
    const refDate = dto.referenceDate ? new Date(dto.referenceDate) : undefined;
    return this.complianceService.runScheduledExpiryScan(refDate);
  }

  @Post('me/reverify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Captain: Submit renewed statutory credentials for re-verification',
    description:
      'Allows captains to submit renewed driving license or vehicle certificates. Resolves outstanding expiry warnings and restores duty eligibility upon valid unexpired submission.',
  })
  @ApiResponse({ status: 200, description: 'Compliance credential re-verified successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request: invalid future date or expired document' })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable: malware scan failed or document infected',
  })
  async reverifyMyCompliance(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: ReverifyComplianceDto,
  ) {
    return this.complianceService.reverifyCompliance(actor, {
      ...dto,
      targetUserId: actor.id,
    });
  }

  @Post(':userId/reverify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Operator: Re-verify statutory credentials on behalf of a captain',
    description:
      'Administrative re-verification. Enforces cross-account authorization check and audit trail.',
  })
  @ApiParam({ name: 'userId', type: 'string', description: 'Target user ID of the captain' })
  @ApiResponse({ status: 200, description: 'Compliance credential re-verified successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: caller lacks driver:write operational permission',
  })
  async reverifyCaptainCompliance(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: ReverifyComplianceDto,
  ) {
    return this.complianceService.reverifyCompliance(actor, {
      ...dto,
      targetUserId: userId,
    });
  }

  @Get('me/warnings')
  @ApiOperation({
    summary: 'Captain: Get active and historical compliance expiry warnings',
    description: 'Retrieves 30d, 15d, 7d, 1d advance notices and expiry warnings for the caller.',
  })
  @ApiResponse({ status: 200, description: 'List of captain compliance warnings' })
  async getMyWarnings(
    @CurrentActor() actor: CurrentActorPayload,
    @Query() query: QueryComplianceWarningsDto,
  ) {
    return this.complianceService.getComplianceWarnings(actor, {
      ...query,
      userId: actor.id,
    });
  }

  @Get('warnings')
  @ApiOperation({
    summary: 'Operator: Query fleet-wide statutory compliance warnings',
    description:
      'Filter compliance warnings by user ID, warning tier, target type, and resolution status.',
  })
  @ApiResponse({ status: 200, description: 'Filtered fleet compliance warnings' })
  @ApiResponse({ status: 403, description: 'Forbidden: unauthorized fleet inspection' })
  async getFleetWarnings(
    @CurrentActor() actor: CurrentActorPayload,
    @Query() query: QueryComplianceWarningsDto,
  ) {
    return this.complianceService.getComplianceWarnings(actor, query);
  }
}
