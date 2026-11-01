import { IsString, IsOptional, IsBoolean, Length, MaxLength, Matches, IsIn } from 'class-validator';
import { AppLanguage, UpdateRiderProfileRequest } from '@ecoride/contracts';

export class UpdateRiderProfileDto implements UpdateRiderProfileRequest {
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'name must be between 2 and 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['te', 'en', 'hi'], { message: 'preferredLanguage must be one of: te, en, hi' })
  preferredLanguage?: AppLanguage;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'emergencyContactName must be between 2 and 100 characters' })
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'emergencyContactPhone must be a valid 10-digit Indian mobile number with +91 prefix',
  })
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'preferredPaymentMode must be between 1 and 50 characters' })
  preferredPaymentMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'defaultPickupNotes cannot exceed 500 characters' })
  defaultPickupNotes?: string;

  @IsOptional()
  @IsBoolean()
  accessibilityNeeds?: boolean;
}
