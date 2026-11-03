import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateFleetOrganizationRequest } from '@ecoride/contracts';

export class CreateFleetOrganizationDto implements CreateFleetOrganizationRequest {
  @ApiProperty({
    description: 'Commercial fleet organization registered entity name',
    example: 'Vizag Coast Green Mobility Cabs Pvt Ltd',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Official corporate / tax registration number (GSTIN / CIN)',
    example: '37AABCV1234F1Z5',
  })
  @IsNotEmpty()
  @IsString()
  businessRegistrationNumber!: string;

  @ApiPropertyOptional({
    description: 'Operating hub city in Andhra Pradesh',
    example: 'visakhapatnam',
    default: 'visakhapatnam',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'Commercial fleet dispatch and emergency contact phone number',
    example: '+919876543210',
  })
  @IsNotEmpty()
  @IsString()
  contactPhone!: string;

  @ApiPropertyOptional({
    description: 'Commercial fleet operations email address',
    example: 'fleet@vizagcoastcabs.in',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({
    description: 'Dedicated financial payout account identifier for ledger settlements',
    example: 'acc_fleet_vizag_coast_01',
  })
  @IsNotEmpty()
  @IsString()
  payoutAccountId!: string;
}
