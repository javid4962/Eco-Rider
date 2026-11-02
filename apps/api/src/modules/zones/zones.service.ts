import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Zone, ServiceCity } from '../../database/entities';
import { IdentityService } from '../identity/identity.service';
import {
  CityOperationalStatus,
  DEFAULT_DISABLED_CATEGORY_SWITCHES,
  GeoJsonPolygon,
  ServiceCityDto,
  ServiceZoneDto,
  VerifyLocationRequest,
  VerifyLocationResponse,
  ZoneOperationalStatus,
} from '@ecoride/contracts';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CreateServiceCityDto,
  CreateServiceZoneDto,
  QueryZonesDto,
  ToggleCategorySwitchDto,
  UpdateServiceCityDto,
  UpdateServiceZoneDto,
} from './dto';

@Injectable()
export class ZonesService {
  private readonly logger = new Logger(ZonesService.name);

  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
    @InjectRepository(ServiceCity)
    private readonly cityRepo: Repository<ServiceCity>,
    private readonly identityService: IdentityService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Evaluates location coordinates, polygonal boundary inclusion, operational status,
   * statutory permit validity, and individual service category switches server-side.
   *
   * Rejects requests outside approved zones or with disabled/expired category flags,
   * even when a client attempts to forge availability flags in the request payload.
   */
  async verifyLocation(request: VerifyLocationRequest): Promise<VerifyLocationResponse> {
    const cityCode = (request.city || '').toLowerCase().trim();
    const evaluatedAt = new Date().toISOString();

    if (!cityCode) {
      return {
        isAuthorized: false,
        city: cityCode,
        serviceCategory: request.serviceCategory,
        isInsideGeofence: false,
        isPermitValid: false,
        isCategoryEnabled: false,
        operationalStatus: 'NONE',
        rejectionReason: 'Operating city is required for geofence validation.',
        evaluatedAt,
      };
    }

    // 1. PostGIS Point-in-Polygon Query
    let matchedZone: {
      id: string;
      code: string;
      name: string;
      city: string;
      operational_status: string;
      evidence_reference: string | null;
      permit_expires_at: Date | string | null;
      category_switches: Record<string, boolean> | string;
      boundary_geojson?: string;
    } | null = null;

    try {
      const rawZones = await this.dataSource.query(
        `
        SELECT 
          z.id,
          z.code,
          z.name,
          z.city,
          z.operational_status,
          z.evidence_reference,
          z.permit_expires_at,
          z.category_switches,
          ST_AsGeoJSON(z.boundary) as boundary_geojson
        FROM "zones" z
        WHERE LOWER(z.city) = $1
          AND z.is_active = true
          AND ST_Contains(z.boundary, ST_SetSRID(ST_MakePoint($2, $3), 4326))
        ORDER BY z.created_at DESC
        LIMIT 1;
      `,
        [cityCode, request.longitude, request.latitude],
      );

      if (rawZones && rawZones.length > 0) {
        matchedZone = rawZones[0];
      }
    } catch {
      // In-memory fallback for unit testing when PostGIS spatial extension/DB is mocked
      const candidateZones = await this.zoneRepo.find({
        where: { city: cityCode, isActive: true },
      });

      for (const z of candidateZones) {
        const poly = this.parseBoundaryPolygon(z.boundary);
        if (poly && this.isPointInPolygon([request.longitude, request.latitude], poly)) {
          matchedZone = {
            id: z.id,
            code: z.code || z.id,
            name: z.name,
            city: z.city,
            operational_status: z.operationalStatus as string,
            evidence_reference: z.evidenceReference || null,
            permit_expires_at: z.permitExpiresAt || null,
            category_switches: z.categorySwitches || {},
          };
          break;
        }
      }
    }

    // 2. Reject if outside all authorized polygonal geofences
    if (!matchedZone) {
      this.logger.warn(
        `Geofence rejection: GPS (${request.latitude}, ${request.longitude}) is outside authorized zones in '${cityCode}'.`,
      );
      return {
        isAuthorized: false,
        city: cityCode,
        serviceCategory: request.serviceCategory,
        isInsideGeofence: false,
        isPermitValid: false,
        isCategoryEnabled: false,
        operationalStatus: 'NONE',
        rejectionReason: `Location (${request.latitude}, ${request.longitude}) is outside authorized polygonal service zones in '${cityCode}'.`,
        evaluatedAt,
      };
    }

    const opStatus = matchedZone.operational_status || ZoneOperationalStatus.DISABLED;

    // 3. Reject if zone operational status is not active or pilot
    if (opStatus !== ZoneOperationalStatus.ACTIVE && opStatus !== ZoneOperationalStatus.PILOT) {
      return {
        isAuthorized: false,
        zoneId: matchedZone.id,
        zoneCode: matchedZone.code,
        zoneName: matchedZone.name,
        city: cityCode,
        serviceCategory: request.serviceCategory,
        isInsideGeofence: true,
        isPermitValid: true,
        isCategoryEnabled: false,
        operationalStatus: opStatus,
        permitExpiresAt: matchedZone.permit_expires_at
          ? new Date(matchedZone.permit_expires_at).toISOString()
          : null,
        rejectionReason: `Service zone '${matchedZone.name}' status is '${opStatus}' (not active for ride requests).`,
        evaluatedAt,
      };
    }

    // 4. Reject if statutory operational permit is expired
    if (matchedZone.permit_expires_at) {
      const expiry = new Date(matchedZone.permit_expires_at);
      if (expiry.getTime() <= Date.now()) {
        return {
          isAuthorized: false,
          zoneId: matchedZone.id,
          zoneCode: matchedZone.code,
          zoneName: matchedZone.name,
          city: cityCode,
          serviceCategory: request.serviceCategory,
          isInsideGeofence: true,
          isPermitValid: false,
          isCategoryEnabled: false,
          operationalStatus: opStatus,
          permitExpiresAt: expiry.toISOString(),
          rejectionReason: `Statutory operating permit for zone '${matchedZone.name}' expired on ${expiry.toISOString()}.`,
          evaluatedAt,
        };
      }
    }

    // 5. Evaluate individual service category switches server-side
    const categorySwitches: Record<string, boolean> =
      typeof matchedZone.category_switches === 'string'
        ? JSON.parse(matchedZone.category_switches)
        : matchedZone.category_switches || {};

    const isCategoryEnabled = categorySwitches[request.serviceCategory] === true;

    // Reject if category switch is disabled (ignoring any client-forged availability flag)
    if (!isCategoryEnabled) {
      if (request.clientForgedAvailability) {
        this.logger.warn(
          `Security Notice: Client attempted to forge availability for '${request.serviceCategory}' in zone '${matchedZone.name}'. Authoritative server-side check enforced.`,
        );
      }
      return {
        isAuthorized: false,
        zoneId: matchedZone.id,
        zoneCode: matchedZone.code,
        zoneName: matchedZone.name,
        city: cityCode,
        serviceCategory: request.serviceCategory,
        isInsideGeofence: true,
        isPermitValid: true,
        isCategoryEnabled: false,
        operationalStatus: opStatus,
        permitExpiresAt: matchedZone.permit_expires_at
          ? new Date(matchedZone.permit_expires_at).toISOString()
          : null,
        rejectionReason: `Service category '${request.serviceCategory}' is disabled in zone '${matchedZone.name}'.`,
        evaluatedAt,
      };
    }

    // 6. Authorized: All spatial and regulatory checks passed
    return {
      isAuthorized: true,
      zoneId: matchedZone.id,
      zoneCode: matchedZone.code,
      zoneName: matchedZone.name,
      city: cityCode,
      serviceCategory: request.serviceCategory,
      isInsideGeofence: true,
      isPermitValid: true,
      isCategoryEnabled: true,
      operationalStatus: opStatus,
      permitExpiresAt: matchedZone.permit_expires_at
        ? new Date(matchedZone.permit_expires_at).toISOString()
        : null,
      evaluatedAt,
    };
  }

  /**
   * Retrieves all service cities with active zone counts.
   */
  async getCities(): Promise<ServiceCityDto[]> {
    const cities = await this.cityRepo.find({ order: { name: 'ASC' } });
    const results: ServiceCityDto[] = [];

    for (const c of cities) {
      const activeZonesCount = await this.zoneRepo.count({
        where: { city: c.code, isActive: true },
      });
      results.push(this.mapCityDto(c, activeZonesCount));
    }

    return results;
  }

  /**
   * Retrieves single city by code.
   */
  async getCity(code: string): Promise<ServiceCityDto> {
    const city = await this.cityRepo.findOne({
      where: { code: code.toLowerCase() },
    });
    if (!city) {
      throw new NotFoundException(`Service city with code '${code}' not found.`);
    }

    const activeZonesCount = await this.zoneRepo.count({
      where: { city: city.code, isActive: true },
    });
    return this.mapCityDto(city, activeZonesCount);
  }

  /**
   * Creates or registers a new service city. Defaults all real categories disabled.
   */
  async createCity(actor: CurrentActorPayload, dto: CreateServiceCityDto): Promise<ServiceCityDto> {
    const code = dto.code.toLowerCase().trim();
    const existing = await this.cityRepo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Service city with code '${code}' already exists.`);
    }

    const mergedSwitches = {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      ...(dto.categorySwitches || {}),
    };

    const city = this.cityRepo.create({
      code,
      name: dto.name,
      state: dto.state || 'Andhra Pradesh',
      operationalStatus: dto.operationalStatus || CityOperationalStatus.DISABLED,
      evidenceReference: dto.evidenceReference || null,
      permitExpiresAt: dto.permitExpiresAt ? new Date(dto.permitExpiresAt) : null,
      categorySwitches: mergedSwitches,
      centerLatitude: dto.centerLatitude,
      centerLongitude: dto.centerLongitude,
    });

    await this.cityRepo.save(city);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      action: 'SERVICE_CITY_CREATED',
      entityType: 'SERVICE_CITY',
      entityId: city.id,
      newState: {
        code: city.code,
        name: city.name,
        operationalStatus: city.operationalStatus,
        evidenceReference: city.evidenceReference,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.mapCityDto(city, 0);
  }

  /**
   * Updates service city configuration.
   */
  async updateCity(
    actor: CurrentActorPayload,
    code: string,
    dto: UpdateServiceCityDto,
  ): Promise<ServiceCityDto> {
    const city = await this.cityRepo.findOne({
      where: { code: code.toLowerCase() },
    });
    if (!city) {
      throw new NotFoundException(`Service city with code '${code}' not found.`);
    }

    if (dto.name !== undefined) city.name = dto.name;
    if (dto.operationalStatus !== undefined) city.operationalStatus = dto.operationalStatus;
    if (dto.evidenceReference !== undefined) city.evidenceReference = dto.evidenceReference;
    if (dto.permitExpiresAt !== undefined) {
      city.permitExpiresAt = dto.permitExpiresAt ? new Date(dto.permitExpiresAt) : null;
    }
    if (dto.categorySwitches !== undefined) {
      city.categorySwitches = {
        ...city.categorySwitches,
        ...dto.categorySwitches,
      };
    }
    if (dto.centerLatitude !== undefined) city.centerLatitude = dto.centerLatitude;
    if (dto.centerLongitude !== undefined) city.centerLongitude = dto.centerLongitude;

    await this.cityRepo.save(city);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      action: 'SERVICE_CITY_UPDATED',
      entityType: 'SERVICE_CITY',
      entityId: city.id,
      newState: {
        code: city.code,
        name: city.name,
        operationalStatus: city.operationalStatus,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    const activeZonesCount = await this.zoneRepo.count({
      where: { city: city.code, isActive: true },
    });
    return this.mapCityDto(city, activeZonesCount);
  }

  /**
   * Lists polygonal service zones with optional filters.
   */
  async getZones(filter?: QueryZonesDto): Promise<ServiceZoneDto[]> {
    const where: Record<string, unknown> = {};
    if (filter?.city) {
      where.city = filter.city.toLowerCase().trim();
    }
    if (filter?.status) {
      where.operationalStatus = filter.status;
    }
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    const zones = await this.zoneRepo.find({
      where,
      order: { name: 'ASC' },
    });

    const results: ServiceZoneDto[] = [];
    for (const z of zones) {
      results.push(await this.mapZoneDto(z));
    }

    return results;
  }

  /**
   * Retrieves single zone by UUID.
   */
  async getZoneById(id: string): Promise<ServiceZoneDto> {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) {
      throw new NotFoundException(`Service zone ${id} not found.`);
    }
    return this.mapZoneDto(zone);
  }

  /**
   * Creates a new polygonal service zone. Defaults all real categories disabled.
   */
  async createZone(actor: CurrentActorPayload, dto: CreateServiceZoneDto): Promise<ServiceZoneDto> {
    const code = dto.code.toLowerCase().trim();
    const existing = await this.zoneRepo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(`Service zone with code '${code}' already exists.`);
    }

    this.validateGeoJsonPolygon(dto.boundary);

    const mergedSwitches = {
      ...DEFAULT_DISABLED_CATEGORY_SWITCHES,
      ...(dto.categorySwitches || {}),
    };

    const zone = this.zoneRepo.create({
      code,
      name: dto.name,
      city: dto.city.toLowerCase().trim(),
      operationalStatus: dto.operationalStatus || ZoneOperationalStatus.DISABLED,
      evidenceReference: dto.evidenceReference || null,
      permitExpiresAt: dto.permitExpiresAt ? new Date(dto.permitExpiresAt) : null,
      categorySwitches: mergedSwitches,
      boundary: dto.boundary,
      centerLatitude: dto.centerLatitude || null,
      centerLongitude: dto.centerLongitude || null,
      isActive: true,
    });

    await this.zoneRepo.save(zone);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      action: 'ZONE_CREATED',
      entityType: 'ZONE',
      entityId: zone.id,
      newState: {
        code: zone.code,
        name: zone.name,
        city: zone.city,
        operationalStatus: zone.operationalStatus,
        evidenceReference: zone.evidenceReference,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.mapZoneDto(zone);
  }

  /**
   * Updates an existing service zone.
   */
  async updateZone(
    actor: CurrentActorPayload,
    id: string,
    dto: UpdateServiceZoneDto,
  ): Promise<ServiceZoneDto> {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) {
      throw new NotFoundException(`Service zone ${id} not found.`);
    }

    if (dto.name !== undefined) zone.name = dto.name;
    if (dto.operationalStatus !== undefined) zone.operationalStatus = dto.operationalStatus;
    if (dto.evidenceReference !== undefined) zone.evidenceReference = dto.evidenceReference;
    if (dto.permitExpiresAt !== undefined) {
      zone.permitExpiresAt = dto.permitExpiresAt ? new Date(dto.permitExpiresAt) : null;
    }
    if (dto.categorySwitches !== undefined) {
      zone.categorySwitches = {
        ...zone.categorySwitches,
        ...dto.categorySwitches,
      };
    }
    if (dto.boundary !== undefined) {
      this.validateGeoJsonPolygon(dto.boundary);
      zone.boundary = dto.boundary;
    }
    if (dto.centerLatitude !== undefined) zone.centerLatitude = dto.centerLatitude;
    if (dto.centerLongitude !== undefined) zone.centerLongitude = dto.centerLongitude;
    if (dto.isActive !== undefined) zone.isActive = dto.isActive;

    await this.zoneRepo.save(zone);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      action: 'ZONE_UPDATED',
      entityType: 'ZONE',
      entityId: zone.id,
      newState: {
        id: zone.id,
        name: zone.name,
        operationalStatus: zone.operationalStatus,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.mapZoneDto(zone);
  }

  /**
   * Toggles an individual service category switch for a zone.
   * Records audited operational permission change with statutory evidence reference.
   */
  async toggleCategorySwitch(
    actor: CurrentActorPayload,
    zoneId: string,
    dto: ToggleCategorySwitchDto,
  ): Promise<ServiceZoneDto> {
    const zone = await this.zoneRepo.findOne({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundException(`Service zone ${zoneId} not found.`);
    }

    const previousState = { ...(zone.categorySwitches || {}) };
    zone.categorySwitches = {
      ...(zone.categorySwitches || {}),
      [dto.serviceCategory]: dto.isEnabled,
    };

    if (dto.evidenceReference) {
      zone.evidenceReference = dto.evidenceReference;
    }

    await this.zoneRepo.save(zone);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      action: 'ZONE_CATEGORY_SWITCH_TOGGLED',
      entityType: 'ZONE',
      entityId: zone.id,
      previousState: {
        category: dto.serviceCategory,
        isEnabled: previousState[dto.serviceCategory] ?? false,
      },
      newState: {
        category: dto.serviceCategory,
        isEnabled: dto.isEnabled,
        evidenceReference: dto.evidenceReference || zone.evidenceReference,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.mapZoneDto(zone);
  }

  // --- Helper Methods ---

  private validateGeoJsonPolygon(boundary: unknown): void {
    if (!boundary || typeof boundary !== 'object') {
      throw new BadRequestException('Boundary must be a valid GeoJSON object.');
    }
    const poly = boundary as GeoJsonPolygon;
    if (
      poly.type !== 'Polygon' ||
      !Array.isArray(poly.coordinates) ||
      poly.coordinates.length === 0
    ) {
      throw new BadRequestException(
        'Boundary must be a GeoJSON Polygon with at least one linear ring.',
      );
    }
    const ring = poly.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
      throw new BadRequestException(
        'A GeoJSON Polygon linear ring must contain at least 4 coordinate pairs.',
      );
    }
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw new BadRequestException(
        'The first and last coordinate pair of a GeoJSON Polygon ring must be identical.',
      );
    }
  }

  private parseBoundaryPolygon(boundary: unknown): number[][] | null {
    if (!boundary || typeof boundary !== 'object') return null;
    const poly = boundary as GeoJsonPolygon;
    if (poly.coordinates && poly.coordinates.length > 0) {
      return poly.coordinates[0];
    }
    return null;
  }

  /**
   * Standard ray-casting point-in-polygon algorithm (Jordan Curve Theorem).
   * Used for deterministic in-memory evaluations and testing fallback.
   *
   * @param point [longitude, latitude]
   * @param vs Array of [longitude, latitude] ring vertices
   */
  public isPointInPolygon(point: [number, number], vs: number[][]): boolean {
    const x = point[0];
    const y = point[1];
    let inside = false;

    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0];
      const yi = vs[i][1];
      const xj = vs[j][0];
      const yj = vs[j][1];

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }

  private mapCityDto(city: ServiceCity, activeZonesCount = 0): ServiceCityDto {
    return {
      id: city.id,
      code: city.code,
      name: city.name,
      state: city.state,
      operationalStatus: city.operationalStatus,
      evidenceReference: city.evidenceReference || null,
      permitExpiresAt: city.permitExpiresAt ? new Date(city.permitExpiresAt).toISOString() : null,
      categorySwitches: city.categorySwitches || {},
      centerLatitude: Number(city.centerLatitude),
      centerLongitude: Number(city.centerLongitude),
      activeZonesCount,
      createdAt: city.createdAt ? new Date(city.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: city.updatedAt ? new Date(city.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  private async mapZoneDto(zone: Zone): Promise<ServiceZoneDto> {
    let boundary: GeoJsonPolygon;

    if (zone.boundary && typeof zone.boundary === 'object' && 'coordinates' in zone.boundary) {
      boundary = zone.boundary as GeoJsonPolygon;
    } else {
      // Query raw GeoJSON from PostGIS if stored as geometry string
      try {
        const rows = await this.dataSource.query(
          `SELECT ST_AsGeoJSON(boundary) as geojson FROM "zones" WHERE id = $1`,
          [zone.id],
        );
        boundary = rows?.[0]?.geojson
          ? JSON.parse(rows[0].geojson)
          : { type: 'Polygon', coordinates: [] };
      } catch {
        boundary = { type: 'Polygon', coordinates: [] };
      }
    }

    return {
      id: zone.id,
      code: zone.code || zone.id,
      name: zone.name,
      city: zone.city,
      operationalStatus: zone.operationalStatus,
      evidenceReference: zone.evidenceReference || null,
      permitExpiresAt: zone.permitExpiresAt ? new Date(zone.permitExpiresAt).toISOString() : null,
      categorySwitches: zone.categorySwitches || {},
      boundary,
      centerLatitude: zone.centerLatitude ? Number(zone.centerLatitude) : null,
      centerLongitude: zone.centerLongitude ? Number(zone.centerLongitude) : null,
      isActive: zone.isActive,
      createdAt: zone.createdAt ? new Date(zone.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: zone.updatedAt ? new Date(zone.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
