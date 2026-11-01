import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  Length,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { CreateSavedLocationRequest, SavedAddressType } from '@ecoride/contracts';

export class CreateSavedLocationDto implements CreateSavedLocationRequest {
  @IsNotEmpty({ message: 'label is required' })
  @IsString({ message: 'label must be a string' })
  @Length(1, 50, { message: 'label must be between 1 and 50 characters' })
  label!: string;

  @IsOptional()
  @IsString({ message: 'addressType must be a string' })
  @IsIn(['PICKUP', 'DROP', 'BOTH'], {
    message: 'addressType must be one of: PICKUP, DROP, BOTH',
  })
  addressType?: SavedAddressType;

  @IsNotEmpty({ message: 'addressLine is required' })
  @IsString({ message: 'addressLine must be a string' })
  @Length(3, 255, { message: 'addressLine must be between 3 and 255 characters' })
  addressLine!: string;

  @IsOptional()
  @IsString({ message: 'landmark must be a string' })
  @MaxLength(100, { message: 'landmark cannot exceed 100 characters' })
  landmark?: string;

  @IsNotEmpty({ message: 'latitude is required' })
  @IsNumber({}, { message: 'latitude must be a valid number' })
  @Min(-90, { message: 'latitude cannot be less than -90' })
  @Max(90, { message: 'latitude cannot be greater than 90' })
  latitude!: number;

  @IsNotEmpty({ message: 'longitude is required' })
  @IsNumber({}, { message: 'longitude must be a valid number' })
  @Min(-180, { message: 'longitude cannot be less than -180' })
  @Max(180, { message: 'longitude cannot be greater than 180' })
  longitude!: number;
}
