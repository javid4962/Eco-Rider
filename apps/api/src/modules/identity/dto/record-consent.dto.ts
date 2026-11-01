import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class RecordConsentDto {
  @IsNotEmpty()
  @IsString()
  consentType!: string;

  @IsNotEmpty()
  @IsString()
  consentVersion!: string;

  @IsNotEmpty()
  @IsBoolean()
  isGranted!: boolean;
}
