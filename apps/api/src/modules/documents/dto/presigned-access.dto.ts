import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, RetentionPolicy, PresignedUploadRequest } from '@ecoride/contracts';

export class PresignedUploadDto implements PresignedUploadRequest {
  @ApiProperty({ enum: DocumentType, example: DocumentType.DRIVING_LICENSE })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @ApiProperty({ example: 'driving_license.pdf' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ example: 1048576, description: 'File size in bytes' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  fileSizeBytes!: number;

  @ApiPropertyOptional({ enum: RetentionPolicy, example: RetentionPolicy.KYC_STATUTORY_5_YEARS })
  @IsOptional()
  @IsEnum(RetentionPolicy)
  retentionPolicy?: RetentionPolicy;
}

export class GenerateSignedUrlQueryDto {
  @ApiPropertyOptional({
    example: 900,
    description: 'Signed URL lifetime in seconds (default 900s = 15min, max 86400s = 24h)',
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(86400)
  @Type(() => Number)
  expiresInSeconds?: number;
}

export class DownloadByTokenQueryDto {
  @ApiProperty({
    description: 'Cryptographically signed HMAC-SHA256 temporary access token',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
