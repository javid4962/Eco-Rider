import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'd3b07384d113edec49eaa6238ad5ff00b1a03975ef71d5330e70417937446690',
    description:
      'Cryptographically secure plaintext refresh token received during login or token rotation',
  })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString({ message: 'Refresh token must be a string' })
  refreshToken!: string;
}
