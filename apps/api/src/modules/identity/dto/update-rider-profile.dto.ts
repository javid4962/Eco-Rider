import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRiderProfileDto {
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  preferredPaymentMode?: string;

  @IsOptional()
  @IsString()
  defaultPickupNotes?: string;

  @IsOptional()
  @IsBoolean()
  accessibilityNeeds?: boolean;
}
