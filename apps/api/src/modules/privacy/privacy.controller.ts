import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import { PrivacyService } from './privacy.service';
import {
  RecordConsentDto,
  RevokeConsentDto,
  CreateDeletionRequestDto,
  EvaluatePermissionDto,
} from './dto';

@ApiTags('Privacy & Consent')
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('policies')
  @ApiOperation({
    summary: 'Get active policy notices and versions',
    description:
      'Returns metadata and active versions for all platform policies, terms, and consent opt-ins (Telugu, English, Hindi).',
  })
  @ApiResponse({ status: 200, description: 'Active policy versions retrieved' })
  getPolicyVersions() {
    return this.privacyService.getPolicyVersions();
  }

  @Get('consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user consents',
    description:
      'Retrieves all granted and revoked consent records for the authenticated commuter or captain.',
  })
  @ApiResponse({ status: 200, description: 'Consents retrieved successfully' })
  async getMyConsents(@CurrentActor() actor: CurrentActorPayload) {
    return this.privacyService.getUserConsents(actor, actor.id);
  }

  @Post('consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Record or update consent',
    description:
      'Records acceptance or refusal of a specific policy notice, purpose-specific location tracking, or communications opt-in.',
  })
  @ApiResponse({ status: 201, description: 'Consent recorded successfully' })
  async recordConsent(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: RecordConsentDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const correlationId = req.headers['x-correlation-id'] as string;
    return this.privacyService.recordConsent(
      actor,
      actor.id,
      dto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('consents/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke optional consent',
    description:
      'Allows a commuter to explicitly withdraw an optional consent (e.g. promotional SMS or nearby offers).',
  })
  @ApiResponse({ status: 200, description: 'Consent revoked successfully' })
  async revokeConsent(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: RevokeConsentDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const correlationId = req.headers['x-correlation-id'] as string;
    return this.privacyService.revokeConsent(
      actor,
      actor.id,
      dto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('evaluate-permission')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'DEMONSTRATE ACCEPTANCE: Evaluate whether a permission is allowed',
    description:
      'Authoritatively verifies whether a permission is allowed, ensuring revoked optional permissions are strictly respected.',
  })
  @ApiResponse({ status: 200, description: 'Permission evaluation result' })
  async evaluatePermission(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: EvaluatePermissionDto,
  ) {
    return this.privacyService.evaluatePermission(actor, actor.id, dto.permission);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Export personal data portfolio',
    description:
      'Pursuant to Section 12 of the DPDP Act 2023, generates a portable structured JSON export of all personal data, consents, and trip summaries.',
  })
  @ApiResponse({ status: 200, description: 'Personal data exported successfully' })
  async exportData(@CurrentActor() actor: CurrentActorPayload, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const correlationId = req.headers['x-correlation-id'] as string;
    return this.privacyService.exportUserData(actor, actor.id, ipAddress, correlationId);
  }

  @Post('deletion-request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request account and personal data deletion',
    description:
      'Evaluates active ride/unsettled balance retention exceptions. If eligible, executes erasure of personal data, saved locations, and sessions, while disclosing mandatory statutory retention exceptions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data deletion processed with statutory retention disclosure',
  })
  @ApiResponse({ status: 422, description: 'Active ride blocks account deletion' })
  async requestDeletion(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: CreateDeletionRequestDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const correlationId = req.headers['x-correlation-id'] as string;
    return this.privacyService.createDeletionRequest(
      actor,
      actor.id,
      dto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Get('deletion-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get data deletion requests history',
    description:
      'Retrieves all historical account deletion requests submitted by the authenticated commuter.',
  })
  @ApiResponse({ status: 200, description: 'Deletion requests retrieved successfully' })
  async getMyDeletionRequests(@CurrentActor() actor: CurrentActorPayload) {
    return this.privacyService.getDeletionRequests(actor, actor.id);
  }

  // ==========================================
  // SCOPED USER & ADMIN ENDPOINTS
  // ==========================================

  @Get('users/:userId/consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user consents by userId' })
  async getUserConsents(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.privacyService.getUserConsents(actor, userId);
  }

  @Post('users/:userId/consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Record user consent by userId' })
  async recordUserConsent(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RecordConsentDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const correlationId = req.headers['x-correlation-id'] as string;
    return this.privacyService.recordConsent(
      actor,
      userId,
      dto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('users/:userId/consents/revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke optional user consent by userId' })
  async revokeUserConsent(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RevokeConsentDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const correlationId = req.headers['x-correlation-id'] as string;
    return this.privacyService.revokeConsent(
      actor,
      userId,
      dto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Post('users/:userId/evaluate-permission')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluate permission for userId' })
  async evaluateUserPermission(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: EvaluatePermissionDto,
  ) {
    return this.privacyService.evaluatePermission(actor, userId, dto.permission);
  }

  @Get('users/:userId/data-export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export personal data by userId' })
  async exportUserData(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const correlationId = req.headers['x-correlation-id'] as string;
    return this.privacyService.exportUserData(actor, userId, ipAddress, correlationId);
  }

  @Post('users/:userId/deletion-request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit deletion request by userId' })
  async requestUserDeletion(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateDeletionRequestDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const correlationId = req.headers['x-correlation-id'] as string;
    return this.privacyService.createDeletionRequest(
      actor,
      userId,
      dto,
      ipAddress,
      userAgent,
      correlationId,
    );
  }

  @Get('users/:userId/deletion-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get deletion requests by userId' })
  async getUserDeletionRequests(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.privacyService.getDeletionRequests(actor, userId);
  }
}
