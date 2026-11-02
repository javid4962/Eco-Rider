import { IsISO8601, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RunExpiryScanDto {
  @ApiPropertyOptional({
    description:
      'Optional reference ISO timestamp to simulate expiry boundaries (defaults to current time)',
    example: '2026-11-03T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  referenceDate?: string;
}
