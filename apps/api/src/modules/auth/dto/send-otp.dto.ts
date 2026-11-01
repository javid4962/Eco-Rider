import { IsNotEmpty, IsString, Matches, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { INDIA_PHONE_REGEX, AuthOtpPurpose } from '@ecoride/contracts';

export class SendOtpDto {
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

  @ApiPropertyOptional({
    enum: ['LOGIN', 'RIDE_START', 'EMERGENCY'],
    default: 'LOGIN',
    description: 'Purpose of the OTP request',
  })
  @IsOptional()
  @IsIn(['LOGIN', 'RIDE_START', 'EMERGENCY'], {
    message: 'Purpose must be one of: LOGIN, RIDE_START, EMERGENCY',
  })
  purpose?: AuthOtpPurpose = 'LOGIN';
}
