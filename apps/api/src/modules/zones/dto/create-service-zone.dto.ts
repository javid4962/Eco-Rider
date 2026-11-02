import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateServiceZoneRequest,
  GeoJsonPolygon,
  ZoneOperationalStatus,
} from '@ecoride/contracts';

export class CreateServiceZoneDto implements CreateServiceZoneRequest {
  @ApiProperty({
    description: 'Unique identifier code for the polygonal zone',
    example: 'vzg_beach_corridor',
  })
  @IsNotEmpty()
  @IsString()
  code!: string;

  @ApiProperty({
    description: 'Human-readable zone name',
    example: 'Visakhapatnam Beach Road EV Corridor',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Associated Andhra Pradesh city code',
    example: 'visakhapatnam',
  })
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiPropertyOptional({
    description: 'Operational status of the zone',
    enum: ZoneOperationalStatus,
    default: ZoneOperationalStatus.DISABLED,
  })
  @IsOptional()
  @IsEnum(ZoneOperationalStatus)
  operationalStatus?: ZoneOperationalStatus;

  @ApiPropertyOptional({
    description: 'Statutory evidence reference (e.g. AP Transport Dept GO or Gazette notification)',
    example: 'AP-RTO-VZG-EV-ZONE-01-2025',
  })
  @IsOptional()
  @IsString()
  evidenceReference?: string;

  @ApiPropertyOptional({
    description: 'Statutory permit expiry timestamp in ISO-8601 format',
    example: '2027-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  permitExpiresAt?: string;

  @ApiPropertyOptional({
    description: 'Individual service category switches. Defaults all real categories disabled.',
    example: { CITY_COMMUTE_2W: false, CAB_PRIVATE_4W: false },
  })
  @IsOptional()
  @IsObject()
  categorySwitches?: Record<string, boolean>;

  @ApiProperty({
    description: 'GeoJSON Polygon boundary geometry (SRID 4326)',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [83.2, 17.65],
          [83.35, 17.65],
          [83.35, 17.75],
          [83.2, 17.75],
          [83.2, 17.65],
        ],
      ],
    },
  })
  @IsNotEmpty()
  @IsObject()
  boundary!: GeoJsonPolygon;

  @ApiPropertyOptional({
    description: 'Centroid latitude for visual pinning',
    example: 17.6868,
  })
  @IsOptional()
  @IsNumber()
  centerLatitude?: number;

  @ApiPropertyOptional({
    description: 'Centroid longitude for visual pinning',
    example: 83.2185,
  })
  @IsOptional()
  @IsNumber()
  centerLongitude?: number;
}
