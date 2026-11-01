import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto } from './dto';
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
}

