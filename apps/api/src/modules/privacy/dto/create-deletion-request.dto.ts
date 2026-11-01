import { IsString, IsOptional, IsBoolean, MaxLength, Equals } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeletionRequestDto {
  @ApiPropertyOptional({
    example: 'Relocating outside Andhra Pradesh',
    description: 'Reason for requesting account and data deletion',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    example: true,
    description:
      'Acknowledgment and understanding that statutory tax records and safety logs will be retained for mandated statutory periods',
  })
  @IsBoolean()
  @Equals(true, {
    message:
      'You must confirm that you understand mandatory statutory retention exceptions before deletion can proceed',
  })
  confirmUnderstandRetention!: boolean;
}
