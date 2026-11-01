import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, LogoutDto } from './dto';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  RequestWithCorrelation,
  CORRELATION_ID_HEADER,
} from '../../common/middleware/correlation-id.middleware';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request synthetic OTP for India mobile authentication or ride start',
    description:
      'Dispatches an OTP with 5-minute expiry and 60-second resend cooldown. Validates Indian phone number format.',
  })
  @ApiHeader({
    name: CORRELATION_ID_HEADER,
    description: 'Optional tracing correlation ID',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'OTP dispatched successfully via synthetic adapter with reference ID',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone format (must match +91 followed by 10 digits starting with 6-9)',
  })
  @ApiResponse({
    status: 429,
    description: 'Resend cooldown active. Please wait before requesting another OTP.',
  })
  async sendOtp(@Body() dto: SendOtpDto, @Req() req: RequestWithCorrelation) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.authService.sendOtp(dto, clientIp, req.correlationId);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify synthetic OTP and issue authenticated session token',
    description:
      'Verifies OTP against attempt limit (max 3), enforces single-use replay prevention, and auto-provisions rider accounts.',
  })
  @ApiHeader({
    name: CORRELATION_ID_HEADER,
    description: 'Optional tracing correlation ID',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully; session token and user profile returned',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP code, expired OTP, or already used (replay attempt)',
  })
  @ApiResponse({
    status: 429,
    description: 'Maximum verification attempts exceeded (brute-force lockout)',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req: RequestWithCorrelation) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;
    return this.authService.verifyOtp(dto, clientIp, userAgent, req.correlationId);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotate refresh token and issue new short-lived access token',
    description:
      'Implements RFC 6819 refresh token rotation. If an already-rotated token is replayed, triggers global session revocation.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Tokens rotated successfully; new 15-minute access token and refresh token returned',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid, expired, revoked, or replayed refresh token',
  })
  async refreshTokens(@Body() dto: RefreshTokenDto, @Req() req: RequestWithCorrelation) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'] as string | undefined;
    return this.authService.refreshTokens(dto, clientIp, userAgent, req.correlationId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Terminate current session and stop future token refresh',
    description:
      'Revokes the specified refresh token session or current authenticated session in the database.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully; future token refresh stopped',
  })
  async logout(
    @Body() dto: LogoutDto,
    @CurrentActor() actor: CurrentActorPayload,
    @Req() req: RequestWithCorrelation,
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.authService.logout(dto, actor, clientIp, req.correlationId);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List active sessions and devices for the authenticated caller',
    description: 'Returns safe session metadata without leaking token secrets or hashes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active sessions retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required to list sessions',
  })
  async getSessions(@CurrentActor() actor: CurrentActorPayload) {
    return this.authService.getSessionsForActor(actor);
  }

  @Delete('sessions/:sessionId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke a specific device session belonging to the authenticated caller',
    description: 'Enforces self-ownership: revoking other users sessions fails with 403 Forbidden.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot revoke session belonging to another account',
  })
  async revokeSession(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.authService.revokeSessionForActor(actor, sessionId);
  }

  @Post('revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Revoke all active sessions on suspected compromise or global signout',
    description: 'Terminates all active sessions for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'All user sessions revoked successfully',
  })
  async revokeAllSessions(
    @CurrentActor() actor: CurrentActorPayload,
    @Body('reason') reason?: string,
  ) {
    return this.authService.revokeAllSessionsForActor(actor, reason || 'USER_GLOBAL_LOGOUT');
  }
}
