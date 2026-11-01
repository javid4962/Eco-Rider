import { IsNotEmpty, IsString, Matches, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { INDIA_PHONE_REGEX, AuthOtpPurpose } from '@ecoride/contracts';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+919876543210',
    description:
      'Indian mobile phone number in E.164 format (+91 followed by 10 digits starting with 6-9)',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(INDIA_PHONE_REGEX, {
    message:
      'Phone number must be a valid Indian mobile number in E.164 format (+91 followed by 10 digits starting with 6-9)',
  })
  phone!: string;

  @ApiProperty({
    example: '123456',
    description: '4-digit (ride start) or 6-digit (login) numeric OTP verification code',
  })
  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString({ message: 'OTP code must be a string' })
  @Matches(/^\d{4,6}$/, {
    message: 'OTP code must be a 4 to 6 digit numeric string without spaces or letters',
  })
  code!: string;

  @ApiPropertyOptional({
    enum: ['LOGIN', 'RIDE_START', 'EMERGENCY'],
    default: 'LOGIN',
    description: 'Purpose of the OTP verification',
  })
  @IsOptional()
  @IsIn(['LOGIN', 'RIDE_START', 'EMERGENCY'], {
    message: 'Purpose must be one of: LOGIN, RIDE_START, EMERGENCY',
  })
  purpose?: AuthOtpPurpose = 'LOGIN';

  @ApiPropertyOptional({
    description: 'Reference ID returned during send-otp request',
  })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({
    example: 'RIDER_APP',
    description:
      'Client application requesting session creation (e.g. RIDER_APP, CAPTAIN_APP, OPS_WEB)',
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    example: 'pixel-7-device-uuid',
    description: 'Optional unique device identifier for session binding',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}
