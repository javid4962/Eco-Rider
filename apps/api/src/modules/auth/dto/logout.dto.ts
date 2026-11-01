import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LogoutDto {
  @ApiPropertyOptional({
    example: 'd3b07384d113edec49eaa6238ad5ff00b1a03975ef71d5330e70417937446690',
    description: 'Optional plaintext refresh token to revoke specific session during logout',
  })
  @IsOptional()
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken?: string;
}
