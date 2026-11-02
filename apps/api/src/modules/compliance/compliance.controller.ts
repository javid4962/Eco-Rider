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
import {
  ToggleDutyDto,
  UpdateComplianceStatusDto,
  ReverifyComplianceDto,
  QueryComplianceWarningsDto,
  RunExpiryScanDto,
} from './dto';
import { PlatformRole } from '@ecoride/contracts';

@ApiTags('Captain Compliance & Duty State')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('captains')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

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
