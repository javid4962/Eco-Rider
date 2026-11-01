import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateDriverProfileDto {
  @IsOptional()
  @IsString()
  badgeNumber?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsUUID()
  assignedVehicleId?: string;
}
