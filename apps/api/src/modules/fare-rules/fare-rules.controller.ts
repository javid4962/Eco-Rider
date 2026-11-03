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
import { FareRulesService } from './fare-rules.service';
import { CreateFareRuleDto, ApproveFareRuleDto, RejectFareRuleDto, QueryFareRulesDto } from './dto';

@ApiTags('Versioned Fare Rules (EV-034)')
@Controller('fare-rules')
export class FareRulesController {
  constructor(private readonly fareRulesService: FareRulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Admin/Operator: Create a new draft fare rule version',
    description:
      'Creates a new draft fare rule with city/category scope, base fare, per-km, waiting, duration rates, taxes, and promotions. Illustrative PDF fares default to DRAFT and cannot be live defaults.',
  })
  @ApiResponse({ status: 201, description: 'Draft fare rule version created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN or OPERATOR role' })
  async createDraft(@CurrentActor() actor: CurrentActorPayload, @Body() dto: CreateFareRuleDto) {
    return this.fareRulesService.createDraft(dto, {
      id: actor.id,
      role: actor.role,
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'List fare rules with optional city, category, or status filters',
  })
  @ApiResponse({ status: 200, description: 'List of fare rules' })
  async listRules(@Query() query: QueryFareRulesDto) {
    return this.fareRulesService.listRules(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single fare rule details by UUID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Fare rule UUID' })
  @ApiResponse({ status: 200, description: 'Fare rule details' })
  @ApiResponse({ status: 404, description: 'Fare rule not found' })
  async getRuleById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fareRulesService.getRuleById(id);
  }

  @Get(':id/audit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Admin/Operator: Get approval and modification audit history for a fare rule',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Fare rule UUID' })
  @ApiResponse({ status: 200, description: 'Audit trail of events for this fare rule' })
  async getRuleAuditTrail(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fareRulesService.getRuleAuditTrail(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Admin/Operator: Approve a draft fare rule version with statutory evidence reference',
    description:
      'Validates statutory evidence reference (e.g. AP Transport Gazette Order), promotes the rule to ACTIVE, and marks previous active versions for the city/category as SUPERSEDED.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Fare rule UUID to approve' })
  @ApiResponse({ status: 200, description: 'Fare rule approved and promoted to ACTIVE' })
  @ApiResponse({
    status: 400,
    description: 'Missing statutory evidence reference or invalid status',
  })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN or OPERATOR role' })
  async approveRule(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveFareRuleDto,
  ) {
    return this.fareRulesService.approveRule(id, dto, {
      id: actor.id,
      role: actor.role,
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Admin/Operator: Reject a draft fare rule version with documented reason',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Fare rule UUID to reject' })
  @ApiResponse({ status: 200, description: 'Fare rule rejected' })
  @ApiResponse({ status: 403, description: 'Forbidden: Requires ADMIN or OPERATOR role' })
  async rejectRule(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectFareRuleDto,
  ) {
    return this.fareRulesService.rejectRule(id, dto, {
      id: actor.id,
      role: actor.role,
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });
  }
}
