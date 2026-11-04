import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  ApiErrorCode,
  CaptainAvailabilityStatus,
  DutyStatus,
  DriverComplianceStatus,
  LOCATION_FRESHNESS_TTL_SECONDS,
  MAX_LOCATION_ACCURACY_METERS,
  MIN_BATTERY_SOC_PERCENT,
  CaptainLocationDto,
  CaptainAvailabilityResponse,
  DispatchEligibilityResponse,
  AvailableCaptainSummaryDto,
  PlatformRole,
} from '@ecoride/contracts';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { CaptainLocationPing } from '../../database/entities/captain-location-ping.entity';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import { ComplianceService } from './compliance.service';
import { RedisService } from '../redis/redis.service';
import { CaptainLocationPingDto, UpdateAvailabilityDto, QueryAvailableCaptainsDto } from './dto';
import { BatteryDispatchService } from './battery-dispatch.service';
import { randomUUID } from 'crypto';

@Injectable()
export class CaptainAvailabilityService {
  private readonly logger = new Logger(CaptainAvailabilityService.name);

  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(CaptainLocationPing)
    private readonly locationPingRepository: Repository<CaptainLocationPing>,
    private readonly complianceService: ComplianceService,
    @Optional()
    private readonly redisService?: RedisService,
    @InjectDataSource()
    private readonly dataSource?: DataSource,
    @Optional()
    private readonly batteryDispatchService?: BatteryDispatchService,
  ) {}

  /**
   * Asserts whether the caller is authorized to modify or view captain state.
   * Captains may only access their own profile. Ops and Admins can access all.
   */
  private assertCanAccessCaptain(
    actor: CurrentActorPayload | undefined,
    targetUserId: string,
    action: string,
  ): void {
    if (!actor) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: `Authentication required for action '${action}'.`,
      });
    }

    const effectiveRole = (actor.role || 'ANONYMOUS').toUpperCase();
    const isOwner = actor.id === targetUserId;
    const isOpsOrAdmin = [
      PlatformRole.OPERATOR,
      PlatformRole.SUPER_ADMIN,
      PlatformRole.SAFETY_OFFICER,
      'DISPATCHER',
      'ADMIN',
      'SYSTEM',
    ].includes(effectiveRole as PlatformRole);

    if (!isOwner && !isOpsOrAdmin) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: `Access denied: Captains cannot modify or inspect availability/location for another captain (action '${action}').`,
      });
    }
  }

  /**
   * Authoritatively updates captain availability status among:
   * OFFLINE, AVAILABLE, RESERVED, ON_TRIP, CHARGING, MAINTENANCE.
   * Enforces role ownership and compliance eligibility.
   */
  async updateAvailability(
    actor: CurrentActorPayload | undefined,
    targetUserId: string,
    dto: UpdateAvailabilityDto,
  ): Promise<CaptainAvailabilityResponse> {
    this.assertCanAccessCaptain(actor, targetUserId, 'UPDATE_AVAILABILITY');

    const driverProfile = await this.driverProfileRepository.findOne({
      where: { userId: targetUserId },
      relations: ['assignedVehicle', 'user'],
    });

    if (!driverProfile) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Driver profile for user '${targetUserId}' not found.`,
      });
    }

    // 1. If transitioning to AVAILABLE, verify statutory compliance eligibility
    if (dto.status === CaptainAvailabilityStatus.AVAILABLE) {
      const eligibility = await this.complianceService.calculateEligibility(targetUserId);
      if (!eligibility.isEligibleForAssignment) {
        this.logger.warn(
          `Captain ${driverProfile.id} attempted to go AVAILABLE while ineligible: ${eligibility.ineligibilityReasons.join('; ')}`,
        );
        throw new UnprocessableEntityException({
          code: ApiErrorCode.UNPROCESSABLE_ENTITY,
          message: `Cannot transition to AVAILABLE: ${eligibility.ineligibilityReasons.join('; ')}`,
        });
      }
      driverProfile.dutyStatus = DutyStatus.ONLINE;
      driverProfile.dutyLastToggledAt = new Date();
    } else if (dto.status === CaptainAvailabilityStatus.OFFLINE) {
      driverProfile.dutyStatus = DutyStatus.OFFLINE;
      driverProfile.dutyLastToggledAt = new Date();
    } else if (dto.status === CaptainAvailabilityStatus.ON_TRIP) {
      driverProfile.dutyStatus = DutyStatus.ON_TRIP;
    }

    // 2. Battery SoC check if provided
    if (dto.batterySocPercent !== undefined && dto.batterySocPercent !== null) {
      driverProfile.batterySocPercent = dto.batterySocPercent;
    }

    // 3. Update status & reason
    const previousStatus = driverProfile.availabilityStatus;
    const now = new Date();
    driverProfile.availabilityStatus = dto.status;
    driverProfile.statusReason = dto.reason || null;
    driverProfile.lastStatusChangedAt = now;
    driverProfile.updatedAt = now;

    await this.driverProfileRepository.save(driverProfile);

    this.logger.log(
      `Captain ${driverProfile.id} availability status changed: '${previousStatus}' -> '${dto.status}' (Reason: ${dto.reason || 'None'})`,
    );

    // 4. Invalidate / update Redis telemetry cache
    await this.syncToRedis(driverProfile);

    return this.buildAvailabilityResponse(driverProfile);
  }

  /**
   * Retrieves the current availability and location freshness for a captain.
   */
  async getAvailability(
    actor: CurrentActorPayload | undefined,
    targetUserId: string,
  ): Promise<CaptainAvailabilityResponse> {
    this.assertCanAccessCaptain(actor, targetUserId, 'GET_AVAILABILITY');

    const driverProfile = await this.driverProfileRepository.findOne({
      where: { userId: targetUserId },
      relations: ['assignedVehicle', 'user'],
    });

    if (!driverProfile) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Driver profile for user '${targetUserId}' not found.`,
      });
    }

    return this.buildAvailabilityResponse(driverProfile);
  }

  /**
   * Ingests an authenticated GPS location ping from the captain.
   * Verifies coordinate boundaries, horizontal accuracy tolerance,
   * updates current location in PostgreSQL with PostGIS, records historical ping,
   * and populates Redis geospatial index.
   */
  async recordLocationPing(
    actor: CurrentActorPayload | undefined,
    targetUserId: string,
    dto: CaptainLocationPingDto,
  ): Promise<CaptainLocationDto> {
    this.assertCanAccessCaptain(actor, targetUserId, 'RECORD_LOCATION');

    const driverProfile = await this.driverProfileRepository.findOne({
      where: { userId: targetUserId },
      relations: ['assignedVehicle'],
    });

    if (!driverProfile) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Driver profile for user '${targetUserId}' not found.`,
      });
    }

    // 1. Validate horizontal accuracy
    if (dto.accuracyMeters < 0 || dto.accuracyMeters > 500) {
      throw new BadRequestException({
        code: ApiErrorCode.LOCATION_ACCURACY_UNACCEPTABLE,
        message: `Invalid location accuracy '${dto.accuracyMeters}m'. Must be between 0 and 500 meters.`,
      });
    }

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
    const now = new Date();
    const ageSeconds = Math.max(0, Math.floor((now.getTime() - recordedAt.getTime()) / 1000));
    const isFresh = ageSeconds <= LOCATION_FRESHNESS_TTL_SECONDS;

    // 2. Update driver_profiles current location with PostGIS geometry point
    driverProfile.currentLatitude = dto.latitude;
    driverProfile.currentLongitude = dto.longitude;
    driverProfile.locationAccuracyMeters = dto.accuracyMeters;
    driverProfile.locationHeadingDegrees =
      dto.headingDegrees ?? driverProfile.locationHeadingDegrees;
    driverProfile.locationSpeedKmph = dto.speedKmph ?? driverProfile.locationSpeedKmph;
    driverProfile.locationAltitudeMeters =
      dto.altitudeMeters ?? driverProfile.locationAltitudeMeters;
    driverProfile.locationUpdatedAt = recordedAt;
    if (dto.batterySocPercent !== undefined && dto.batterySocPercent !== null) {
      driverProfile.batterySocPercent = dto.batterySocPercent;
    }
    driverProfile.updatedAt = now;

    // Direct SQL update with ST_SetSRID for spatial index accuracy
    if (this.dataSource) {
      await this.dataSource.query(
        `UPDATE "driver_profiles"
         SET "current_latitude" = $1,
             "current_longitude" = $2,
             "current_location" = ST_SetSRID(ST_MakePoint($2, $1), 4326),
             "location_accuracy_meters" = $3,
             "location_heading_degrees" = $4,
             "location_speed_kmph" = $5,
             "location_altitude_meters" = $6,
             "location_updated_at" = $7,
             "battery_soc_percent" = COALESCE($8, "battery_soc_percent"),
             "updated_at" = NOW()
         WHERE "id" = $9`,
        [
          dto.latitude,
          dto.longitude,
          dto.accuracyMeters,
          dto.headingDegrees ?? null,
          dto.speedKmph ?? null,
          dto.altitudeMeters ?? null,
          recordedAt,
          dto.batterySocPercent ?? null,
          driverProfile.id,
        ],
      );

      // Record immutable location ping record
      await this.dataSource.query(
        `INSERT INTO "captain_location_pings" (
           "id", "driver_profile_id", "latitude", "longitude", "location",
           "accuracy_meters", "heading_degrees", "speed_kmph", "altitude_meters",
           "battery_soc_percent", "availability_status", "is_fresh", "recorded_at", "created_at"
         )
         VALUES (
           $1, $2, $3, $4, ST_SetSRID(ST_MakePoint($4, $3), 4326),
           $5, $6, $7, $8,
           $9, $10, $11, $12, NOW()
         )`,
        [
          randomUUID(),
          driverProfile.id,
          dto.latitude,
          dto.longitude,
          dto.accuracyMeters,
          dto.headingDegrees ?? null,
          dto.speedKmph ?? null,
          dto.altitudeMeters ?? null,
          dto.batterySocPercent ?? null,
          driverProfile.availabilityStatus,
          isFresh,
          recordedAt,
        ],
      );
    } else {
      await this.driverProfileRepository.save(driverProfile);
      await this.locationPingRepository.save(
        this.locationPingRepository.create({
          id: randomUUID(),
          driverProfileId: driverProfile.id,
          latitude: dto.latitude,
          longitude: dto.longitude,
          location: '0101000020E6100000...',
          accuracyMeters: dto.accuracyMeters,
          headingDegrees: dto.headingDegrees ?? null,
          speedKmph: dto.speedKmph ?? null,
          altitudeMeters: dto.altitudeMeters ?? null,
          batterySocPercent: dto.batterySocPercent ?? null,
          availabilityStatus: driverProfile.availabilityStatus,
          isFresh,
          recordedAt,
        }),
      );
    }

    // 3. Sync to Redis Geospatial index if available
    await this.syncToRedis(driverProfile);

    return {
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracyMeters: dto.accuracyMeters,
      headingDegrees: dto.headingDegrees ?? null,
      speedKmph: dto.speedKmph ?? null,
      altitudeMeters: dto.altitudeMeters ?? null,
      batterySocPercent:
        dto.batterySocPercent ??
        (driverProfile.batterySocPercent ? Number(driverProfile.batterySocPercent) : null),
      updatedAt: recordedAt.toISOString(),
      isFresh,
      ageSeconds,
    };
  }

  /**
   * Evaluates multi-factor dispatch offer eligibility for a captain.
   * Stale, offline, charging, maintenance, or low-battery captains are strictly rejected.
   */
  async getDispatchEligibility(
    actor: CurrentActorPayload | undefined,
    targetUserId: string,
  ): Promise<DispatchEligibilityResponse> {
    this.assertCanAccessCaptain(actor, targetUserId, 'CHECK_DISPATCH_ELIGIBILITY');

    const driverProfile = await this.driverProfileRepository.findOne({
      where: { userId: targetUserId },
      relations: ['assignedVehicle', 'user'],
    });

    if (!driverProfile) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Driver profile for user '${targetUserId}' not found.`,
      });
    }

    const ineligibilityReasons: string[] = [];
    const now = new Date();

    // 1. Check availability lifecycle state
    const status = driverProfile.availabilityStatus as CaptainAvailabilityStatus;
    if (status === CaptainAvailabilityStatus.OFFLINE) {
      ineligibilityReasons.push('Captain is currently OFFLINE.');
    } else if (status === CaptainAvailabilityStatus.CHARGING) {
      ineligibilityReasons.push('Captain EV is actively CHARGING / battery swapping.');
    } else if (status === CaptainAvailabilityStatus.MAINTENANCE) {
      ineligibilityReasons.push('Captain vehicle is undergoing MAINTENANCE.');
    } else if (status === CaptainAvailabilityStatus.RESERVED) {
      ineligibilityReasons.push('Captain is already RESERVED for another booking.');
    } else if (status === CaptainAvailabilityStatus.ON_TRIP) {
      ineligibilityReasons.push('Captain is currently ON_TRIP with a passenger.');
    }

    // 2. Check location freshness (30-second TTL)
    let isLocationFresh = false;
    let locationAgeSeconds: number | null = null;

    if (!driverProfile.locationUpdatedAt) {
      ineligibilityReasons.push('Captain has never emitted location telemetry.');
    } else {
      locationAgeSeconds = Math.max(
        0,
        Math.floor((now.getTime() - driverProfile.locationUpdatedAt.getTime()) / 1000),
      );
      isLocationFresh = locationAgeSeconds <= LOCATION_FRESHNESS_TTL_SECONDS;
      if (!isLocationFresh) {
        ineligibilityReasons.push(
          `Location telemetry is stale (${locationAgeSeconds}s old; maximum freshness threshold is ${LOCATION_FRESHNESS_TTL_SECONDS}s).`,
        );
      }
    }

    // 3. Check horizontal GPS accuracy (<= 50m tolerance)
    const accuracy = driverProfile.locationAccuracyMeters ?? null;
    const isAccuracyAcceptable = accuracy !== null && accuracy <= MAX_LOCATION_ACCURACY_METERS;
    if (!isAccuracyAcceptable) {
      ineligibilityReasons.push(
        `Location accuracy (${accuracy ?? 'unknown'}m) exceeds maximum ${MAX_LOCATION_ACCURACY_METERS}m tolerance.`,
      );
    }

    // 4. Check battery State of Charge (>= 20% safety threshold)
    const soc = driverProfile.batterySocPercent
      ? Number(driverProfile.batterySocPercent)
      : driverProfile.assignedVehicle?.currentSocPercent
        ? Number(driverProfile.assignedVehicle.currentSocPercent)
        : null;

    const isBatterySufficient = soc !== null && soc >= MIN_BATTERY_SOC_PERCENT;
    if (!isBatterySufficient) {
      ineligibilityReasons.push(
        `Vehicle battery State of Charge (${soc ?? 'unknown'}%) is below mandatory ${MIN_BATTERY_SOC_PERCENT}% safety buffer.`,
      );
    }

    // 5. Check compliance verification
    if (driverProfile.verificationStatus !== DriverComplianceStatus.VERIFIED) {
      ineligibilityReasons.push(
        `Captain compliance is not VERIFIED (current status: ${driverProfile.verificationStatus}).`,
      );
    }

    // 6. Check EV vehicle roadworthiness & BEV propulsion (EV-041)
    if (driverProfile.assignedVehicle) {
      const v = driverProfile.assignedVehicle;
      if (v.propulsionType !== 'BATTERY_ELECTRIC') {
        ineligibilityReasons.push(
          `Vehicle propulsion is not 100% Battery Electric (${v.propulsionType}). Non-BEVs cannot be dispatched.`,
        );
      }
      if (v.verificationStatus !== 'VERIFIED') {
        ineligibilityReasons.push(
          `Vehicle verification status is '${v.verificationStatus}'. Only VERIFIED vehicles can receive dispatch offers.`,
        );
      }
      if (!v.isActive) {
        ineligibilityReasons.push('Vehicle is inactive or decommissioned in fleet inventory.');
      }
      if (!v.greenPlateVerified) {
        ineligibilityReasons.push('Vehicle green commercial plate is not verified.');
      }
      if (!v.isRoadworthy) {
        ineligibilityReasons.push(
          'Vehicle statutory documents (insurance, fitness certificate, or permit) are expired or invalid.',
        );
      }

      // Check battery telemetry freshness (EV-041)
      const batteryPingAt = v.telemetryLastPingAt ?? driverProfile.locationUpdatedAt;
      if (!batteryPingAt) {
        ineligibilityReasons.push(
          'No battery telemetry ping timestamp recorded. Range is unknown.',
        );
      } else {
        const batteryAgeSeconds = Math.max(
          0,
          Math.floor((now.getTime() - new Date(batteryPingAt).getTime()) / 1000),
        );
        const maxAge = this.batteryDispatchService
          ? this.batteryDispatchService.getPolicyConfig().telemetryMaxAgeSeconds
          : 120;
        if (batteryAgeSeconds > maxAge) {
          ineligibilityReasons.push(
            `Battery telemetry is stale (${batteryAgeSeconds}s old; maximum freshness allowed is ${maxAge}s).`,
          );
        }
      }
    }

    const isEligibleForDispatch = ineligibilityReasons.length === 0;

    return {
      captainId: driverProfile.id,
      userId: driverProfile.userId,
      availabilityStatus: status,
      isEligibleForDispatch,
      isLocationFresh,
      locationAgeSeconds,
      isAccuracyAcceptable,
      accuracyMeters: accuracy,
      batterySocPercent: soc,
      isBatterySufficient,
      ineligibilityReasons,
    };
  }

  /**
   * Spatial proximity search returning only dispatch-eligible captains.
   * Stale, offline, charging, maintenance, and low-battery captains are filtered out.
   */
  async findAvailableCaptainsForDispatch(
    filter: QueryAvailableCaptainsDto,
  ): Promise<AvailableCaptainSummaryDto[]> {
    if (!this.dataSource) {
      return [];
    }

    const radiusMeters = (filter.radiusKm || 5) * 1000;
    const hasCoords = filter.latitude !== undefined && filter.longitude !== undefined;

    let query = `
      SELECT
        dp.id as "captainId",
        dp.user_id as "userId",
        u.name as "name",
        v.id as "vehicleId",
        v.registration_number as "registrationNumber",
        v.vehicle_category as "vehicleCategory",
        dp.current_latitude as "latitude",
        dp.current_longitude as "longitude",
        dp.location_accuracy_meters as "accuracyMeters",
        dp.battery_soc_percent as "batterySocPercent",
        ROUND(EXTRACT(EPOCH FROM (NOW() - dp.location_updated_at))) as "locationAgeSeconds"
        ${
          hasCoords
            ? `, ROUND(ST_Distance(dp.current_location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography)) as "distanceMeters"`
            : ''
        }
      FROM "driver_profiles" dp
      INNER JOIN "users" u ON u.id = dp.user_id
      LEFT JOIN "vehicles" v ON v.id = dp.assigned_vehicle_id
      WHERE dp.availability_status = 'AVAILABLE'
        AND dp.verification_status = 'VERIFIED'
        AND dp.location_updated_at IS NOT NULL
        AND dp.location_updated_at >= NOW() - INTERVAL '30 seconds'
        AND dp.location_accuracy_meters <= 50.0
        AND (dp.battery_soc_percent >= 20.0 OR dp.battery_soc_percent IS NULL)
        AND dp.current_location IS NOT NULL
    `;

    const params: (string | number)[] = [];

    if (hasCoords) {
      params.push(filter.latitude!, filter.longitude!, radiusMeters);
      query += ` AND ST_DWithin(dp.current_location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, $3)`;
    }

    if (filter.city) {
      params.push(filter.city.toLowerCase());
      query += ` AND LOWER(dp.city) = $${params.length}`;
    }

    if (filter.serviceCategory) {
      params.push(filter.serviceCategory);
      query += ` AND v.vehicle_category = $${params.length}`;
    }

    if (hasCoords) {
      query += ` ORDER BY "distanceMeters" ASC`;
    } else {
      query += ` ORDER BY dp.location_updated_at DESC`;
    }

    const rows = await this.dataSource.query(query, params);

    return rows.map((r: Record<string, unknown>) => ({
      captainId: String(r.captainId),
      userId: String(r.userId),
      name: String(r.name || 'Captain'),
      vehicleId: r.vehicleId ? String(r.vehicleId) : null,
      registrationNumber: r.registrationNumber ? String(r.registrationNumber) : null,
      vehicleCategory: r.vehicleCategory ? String(r.vehicleCategory) : null,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      accuracyMeters: Number(r.accuracyMeters),
      batterySocPercent: r.batterySocPercent ? Number(r.batterySocPercent) : null,
      locationAgeSeconds: Number(r.locationAgeSeconds || 0),
      distanceMeters: r.distanceMeters !== undefined ? Number(r.distanceMeters) : null,
    }));
  }

  // --- Helper Methods ---

  private buildAvailabilityResponse(driverProfile: DriverProfile): CaptainAvailabilityResponse {
    const now = new Date();
    let locationDto: CaptainLocationDto | null = null;
    let isLocationFresh = false;

    if (
      driverProfile.currentLatitude &&
      driverProfile.currentLongitude &&
      driverProfile.locationUpdatedAt
    ) {
      const ageSeconds = Math.max(
        0,
        Math.floor((now.getTime() - driverProfile.locationUpdatedAt.getTime()) / 1000),
      );
      isLocationFresh = ageSeconds <= LOCATION_FRESHNESS_TTL_SECONDS;

      locationDto = {
        latitude: driverProfile.currentLatitude,
        longitude: driverProfile.currentLongitude,
        accuracyMeters: driverProfile.locationAccuracyMeters ?? 0,
        headingDegrees: driverProfile.locationHeadingDegrees ?? null,
        speedKmph: driverProfile.locationSpeedKmph ?? null,
        altitudeMeters: driverProfile.locationAltitudeMeters ?? null,
        batterySocPercent: driverProfile.batterySocPercent
          ? Number(driverProfile.batterySocPercent)
          : null,
        updatedAt: driverProfile.locationUpdatedAt.toISOString(),
        isFresh: isLocationFresh,
        ageSeconds,
      };
    }

    const ineligibilityReasons: string[] = [];
    const status = (driverProfile.availabilityStatus ||
      CaptainAvailabilityStatus.OFFLINE) as CaptainAvailabilityStatus;

    if (status !== CaptainAvailabilityStatus.AVAILABLE) {
      ineligibilityReasons.push(
        `Captain is in '${status}' state (must be AVAILABLE to receive offers).`,
      );
    }
    if (!isLocationFresh) {
      ineligibilityReasons.push('Captain location is stale or has never been reported.');
    }
    if (
      driverProfile.locationAccuracyMeters !== null &&
      driverProfile.locationAccuracyMeters !== undefined &&
      driverProfile.locationAccuracyMeters > MAX_LOCATION_ACCURACY_METERS
    ) {
      ineligibilityReasons.push(
        `Location accuracy (${driverProfile.locationAccuracyMeters}m) exceeds 50m tolerance.`,
      );
    }
    const soc = driverProfile.batterySocPercent ? Number(driverProfile.batterySocPercent) : null;
    if (soc !== null && soc < MIN_BATTERY_SOC_PERCENT) {
      ineligibilityReasons.push(`Battery State of Charge (${soc}%) is below 20% minimum.`);
    }

    return {
      captainId: driverProfile.id,
      userId: driverProfile.userId,
      availabilityStatus: status,
      dutyStatus: driverProfile.dutyStatus as DutyStatus,
      location: locationDto,
      isEligibleForDispatch: ineligibilityReasons.length === 0,
      ineligibilityReasons,
      lastStatusChangedAt: driverProfile.lastStatusChangedAt
        ? driverProfile.lastStatusChangedAt.toISOString()
        : now.toISOString(),
    };
  }

  private async syncToRedis(driverProfile: DriverProfile): Promise<void> {
    if (!this.redisService) return;
    const redis = this.redisService.getClient();
    if (!redis || redis.status !== 'ready') return;

    try {
      const key = `captain:telemetry:${driverProfile.userId}`;
      const payload = {
        captainId: driverProfile.id,
        userId: driverProfile.userId,
        availabilityStatus: driverProfile.availabilityStatus,
        latitude: driverProfile.currentLatitude,
        longitude: driverProfile.currentLongitude,
        accuracyMeters: driverProfile.locationAccuracyMeters,
        batterySocPercent: driverProfile.batterySocPercent,
        updatedAt: driverProfile.locationUpdatedAt?.toISOString(),
      };

      // Set key with 30s TTL matching freshness window
      await redis.setex(key, LOCATION_FRESHNESS_TTL_SECONDS, JSON.stringify(payload));

      if (driverProfile.currentLatitude && driverProfile.currentLongitude) {
        await redis.geoadd(
          'captains:locations:geo',
          driverProfile.currentLongitude,
          driverProfile.currentLatitude,
          driverProfile.userId,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to sync captain telemetry to Redis: ${msg}`);
    }
  }
}
