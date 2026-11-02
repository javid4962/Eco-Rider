import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressSuggestionsQueryDto {
  @ApiProperty({
    description: 'Search query for address or landmark autocompletion',
    example: 'rk beach',
  })
  @IsNotEmpty()
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: 'Optional municipal city filter (e.g. visakhapatnam, vijayawada)',
    example: 'visakhapatnam',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of suggestions to return (1-50)',
    example: 5,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
