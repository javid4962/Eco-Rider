import { IsString, IsNotEmpty, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordConsentDto {
  @ApiProperty({
    example: 'COMMUNICATIONS_MARKETING_SMS',
    description: 'Consent type identifier (notice, location, or communications opt-in)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  consentType!: string;

  @ApiProperty({
    example: 'v1.0',
    description: 'Version string of the policy or consent notice being accepted',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  consentVersion!: string;

  @ApiProperty({
    example: true,
    description: 'Whether the consent is actively granted (true) or withheld/revoked (false)',
  })
  @IsBoolean()
  isGranted!: boolean;
}
