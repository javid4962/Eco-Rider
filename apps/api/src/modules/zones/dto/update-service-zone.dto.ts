import {
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  GeoJsonPolygon,
  UpdateServiceZoneRequest,
  ZoneOperationalStatus,
} from '@ecoride/contracts';

export class UpdateServiceZoneDto implements UpdateServiceZoneRequest {
  @ApiPropertyOptional({
    description: 'Human-readable zone name',
    example: 'Visakhapatnam Beach Road Extended EV Corridor',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Operational status of the zone',
    enum: ZoneOperationalStatus,
  })
  @IsOptional()
  @IsEnum(ZoneOperationalStatus)
  operationalStatus?: ZoneOperationalStatus;

  @ApiPropertyOptional({
    description: 'Statutory evidence reference',
    example: 'AP-RTO-VZG-EV-ZONE-01-RENEWED',
  })
  @IsOptional()
  @IsString()
  evidenceReference?: string;

  @ApiPropertyOptional({
    description: 'Statutory permit expiry timestamp in ISO-8601 format',
    example: '2028-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  permitExpiresAt?: string;

  @ApiPropertyOptional({
    description: 'Individual service category switches map',
    example: { CITY_COMMUTE_2W: true, CAB_PRIVATE_4W: false },
  })
  @IsOptional()
  @IsObject()
  categorySwitches?: Record<string, boolean>;

  @ApiPropertyOptional({
    description: 'GeoJSON Polygon boundary geometry (SRID 4326)',
  })
  @IsOptional()
  @IsObject()
  boundary?: GeoJsonPolygon;

  @ApiPropertyOptional({
    description: 'Centroid latitude',
    example: 17.6868,
  })
  @IsOptional()
  @IsNumber()
  centerLatitude?: number;

  @ApiPropertyOptional({
    description: 'Centroid longitude',
    example: 83.2185,
  })
  @IsOptional()
  @IsNumber()
  centerLongitude?: number;

  @ApiPropertyOptional({
    description: 'General active toggle',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
