import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { IdentityService } from './identity.service';
import { CurrentActor, CurrentActorPayload } from './current-actor.decorator';
import {
  UpdateRiderProfileDto,
  UpdateDriverProfileDto,
  ChangeUserRoleDto,
  RecordConsentDto,
} from './dto';

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Get('roles')
  async getRoles() {
    return this.identityService.getRoles();
  }

  @Get('users/:userId/profile')
  async getUserProfile(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.identityService.getUserProfile(actor, userId);
  }

  @Patch('users/:userId/rider-profile')
  async updateRiderProfile(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateRiderProfileDto,
  ) {
    return this.identityService.updateRiderProfile(actor, userId, dto);
  }

  @Patch('users/:userId/driver-profile')
  async updateDriverProfile(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    return this.identityService.updateDriverProfile(actor, userId, dto);
  }

  @Post('users/:userId/role')
  async changeUserRole(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ChangeUserRoleDto,
  ) {
    return this.identityService.changeUserRole(actor, userId, dto.newRole, dto.reason);
  }

  @Get('users/:userId/sessions')
  async getUserSessions(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.identityService.getUserSessions(actor, userId);
  }

  @Delete('users/:userId/sessions/:sessionId')
  async revokeSession(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.identityService.revokeSession(actor, userId, sessionId);
  }

  @Post('users/:userId/sessions/revoke-all')
  @HttpCode(HttpStatus.OK)
  async revokeAllUserSessions(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('reason') reason?: string,
  ) {
    return this.identityService.revokeAllUserSessions(actor, userId, reason || 'USER_INITIATED');
  }

  @Get('users/:userId/consents')
  async getUserConsents(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.identityService.getUserConsents(actor, userId);
  }

  @Post('users/:userId/consents')
  async recordConsent(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RecordConsentDto,
  ) {
    return this.identityService.recordConsent(
      actor,
      userId,
      dto.consentType,
      dto.consentVersion,
      dto.isGranted,
    );
  }

  @Get('audit-events')
  async getAuditEvents(
    @CurrentActor() actor: CurrentActorPayload,
    @Query('targetUserId') targetUserId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: number,
  ) {
    return this.identityService.getAuditEvents(actor, { targetUserId, action, limit });
  }
}
