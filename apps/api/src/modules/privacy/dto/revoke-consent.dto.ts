import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RevokeConsentDto {
  @ApiProperty({
    example: 'COMMUNICATIONS_MARKETING_SMS',
    description: 'Consent type identifier to revoke',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  consentType!: string;

  @ApiPropertyOptional({
    example: 'Too many marketing text messages',
    description: 'Optional commuter-provided reason for consent revocation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
