import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, RetentionPolicy, UploadDocumentRequest } from '@ecoride/contracts';

export class UploadDocumentDto implements UploadDocumentRequest {
  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.DRIVING_LICENSE,
    description: 'Category of document or KYC artifact being uploaded',
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @ApiProperty({
    example: 'driver_license_front.jpg',
    description: 'Original name of the uploaded document',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'Claimed MIME type of the file (verified via magic byte inspection)',
  })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({
    example:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    description: 'Base64-encoded raw file content for direct secure upload',
  })
  @IsString()
  @IsNotEmpty()
  contentBase64!: string;

  @ApiPropertyOptional({
    enum: RetentionPolicy,
    example: RetentionPolicy.KYC_STATUTORY_5_YEARS,
    description: 'Statutory or operational retention policy governing this document',
  })
  @IsOptional()
  @IsEnum(RetentionPolicy)
  retentionPolicy?: RetentionPolicy;
}
