import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { ComplianceService } from './compliance.service';
import { ToggleDutyDto, UpdateComplianceStatusDto } from './dto';

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
}
