import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  ApiErrorCode,
  BatteryDispatchPolicyConfig,
  DEFAULT_BATTERY_DISPATCH_POLICY,
  TELEMETRY_SOURCE_MAX_AGE_SECONDS,
  AP_PILOT_CHARGING_DEPOTS,
  ChargingDepot,
  BatteryDispatchEvaluationRequest,
  BatteryDispatchEvaluationResult,
  BatteryDispatchRecoveryGuide,
  VehicleBatteryDetails,
  TripDistanceBreakdown,
  CaptainBatterySyncRequest,
  CaptainBatterySyncResponse,
  RangeTelemetrySource,
  PropulsionType,
  VehicleVerificationStatus,
  PlatformRole,
} from '@ecoride/contracts';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { CurrentActorPayload } from '../identity/current-actor.decorator';

@Injectable()
export class BatteryDispatchService {
  private readonly logger = new Logger(BatteryDispatchService.name);

  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @Optional()
    private readonly configService?: ConfigService,
  ) {}

  /**
   * Resolves authoritative policy thresholds with optional request-level overrides.
   * Priority: request overrides > environment config > production defaults.
   */
  public getPolicyConfig(
    overrides?: Partial<BatteryDispatchPolicyConfig>,
  ): BatteryDispatchPolicyConfig {
    const minReserveSocPercent =
      overrides?.minReserveSocPercent ??
      this.configService?.get<number>('batteryDispatch.minReserveSocPercent') ??
      (process.env.EV_DISPATCH_MIN_RESERVE_SOC
        ? parseFloat(process.env.EV_DISPATCH_MIN_RESERVE_SOC)
        : DEFAULT_BATTERY_DISPATCH_POLICY.minReserveSocPercent);

    const minReserveRangeKm =
      overrides?.minReserveRangeKm ??
      this.configService?.get<number>('batteryDispatch.minReserveRangeKm') ??
      (process.env.EV_DISPATCH_MIN_RESERVE_RANGE_KM
        ? parseFloat(process.env.EV_DISPATCH_MIN_RESERVE_RANGE_KM)
        : DEFAULT_BATTERY_DISPATCH_POLICY.minReserveRangeKm);

    const contingencyChargerDistanceKm =
      overrides?.contingencyChargerDistanceKm ??
      this.configService?.get<number>('batteryDispatch.contingencyChargerDistanceKm') ??
      (process.env.EV_DISPATCH_CONTINGENCY_CHARGER_KM
        ? parseFloat(process.env.EV_DISPATCH_CONTINGENCY_CHARGER_KM)
        : DEFAULT_BATTERY_DISPATCH_POLICY.contingencyChargerDistanceKm);

    const telemetryMaxAgeSeconds =
      overrides?.telemetryMaxAgeSeconds ??
      this.configService?.get<number>('batteryDispatch.telemetryMaxAgeSeconds') ??
      (process.env.EV_DISPATCH_TELEMETRY_MAX_AGE_SECONDS
        ? parseInt(process.env.EV_DISPATCH_TELEMETRY_MAX_AGE_SECONDS, 10)
        : DEFAULT_BATTERY_DISPATCH_POLICY.telemetryMaxAgeSeconds);

    const maxPickupDistanceKm =
      overrides?.maxPickupDistanceKm ??
      this.configService?.get<number>('batteryDispatch.maxPickupDistanceKm') ??
      (process.env.EV_DISPATCH_MAX_PICKUP_DISTANCE_KM
        ? parseFloat(process.env.EV_DISPATCH_MAX_PICKUP_DISTANCE_KM)
        : DEFAULT_BATTERY_DISPATCH_POLICY.maxPickupDistanceKm);

    return {
      minReserveSocPercent,
      minReserveRangeKm,
      contingencyChargerDistanceKm,
      telemetryMaxAgeSeconds,
      maxPickupDistanceKm,
    };
  }

  /**
   * Great-Circle Distance calculation using Haversine formula (km).
   */
  public calculateHaversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180.0;
    const R = 6371.0; // Earth radius in kilometers

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c * 10) / 10;
  }

  /**
   * Resolves the nearest verified AP charging depot or battery swap hub to given coordinates.
   */
  public findNearestDepot(
    lat: number,
    lon: number,
    city?: string,
  ): { depot: ChargingDepot; distanceKm: number } | null {
    let candidateDepots = AP_PILOT_CHARGING_DEPOTS.filter((d) => d.isActive);
    if (city) {
      const cityLower = city.toLowerCase();
      const filtered = candidateDepots.filter((d) => d.city.toLowerCase() === cityLower);
      if (filtered.length > 0) {
        candidateDepots = filtered;
      }
    }

    if (candidateDepots.length === 0) {
      return null;
    }

    let nearest: ChargingDepot = candidateDepots[0];
    let minDistance = this.calculateHaversineDistanceKm(
      lat,
      lon,
      nearest.latitude,
      nearest.longitude,
    );

    for (let i = 1; i < candidateDepots.length; i++) {
      const depot = candidateDepots[i];
      const dist = this.calculateHaversineDistanceKm(lat, lon, depot.latitude, depot.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = depot;
      }
    }

    return { depot: nearest, distanceKm: minDistance };
  }

  /**
   * Asserts whether caller is authorized to view or mutate captain/vehicle telemetry.
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
        message: `Access denied: Captains cannot modify or inspect telemetry for another captain (action '${action}').`,
      });
    }
  }

  /**
   * Evaluates comprehensive EV battery dispatch eligibility for a trip.
   * Excludes low battery, stale/unknown range, unapproved EV, and excessive pickup distance.
   */
  async evaluateDispatchEligibility(
    request: BatteryDispatchEvaluationRequest,
    actor?: CurrentActorPayload,
  ): Promise<BatteryDispatchEvaluationResult> {
    const policy = this.getPolicyConfig(request.policyOverrides);
    const now = new Date();
    const ineligibilityReasons: string[] = [];
    let exclusionCode: BatteryDispatchEvaluationResult['exclusionCode'] = null;

    let driverProfile: DriverProfile | null = null;
    let vehicle: Vehicle | null = null;

    // 1. Resolve DriverProfile and Vehicle
    if (request.captainId) {
      // Query by DriverProfile id or user_id
      driverProfile = await this.driverProfileRepository.findOne({
        where: [{ id: request.captainId }, { userId: request.captainId }],
        relations: ['assignedVehicle', 'user'],
      });

      if (driverProfile) {
        if (actor) {
          this.assertCanAccessCaptain(actor, driverProfile.userId, 'EVALUATE_BATTERY_DISPATCH');
        }
        vehicle = driverProfile.assignedVehicle || null;
        if (!vehicle && driverProfile.assignedVehicleId) {
          vehicle = await this.vehicleRepository.findOne({
            where: { id: driverProfile.assignedVehicleId },
          });
        }
      }
    }

    if (!vehicle && request.vehicleId) {
      vehicle = await this.vehicleRepository.findOne({
        where: { id: request.vehicleId },
      });
    }

    // 2. Validate Vehicle Existence and Statutory Approval
    if (!vehicle) {
      ineligibilityReasons.push('No EV vehicle assigned or found for this dispatch candidate.');
      exclusionCode = ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED;
    } else {
      // Strict 100% BEV check
      if (vehicle.propulsionType !== PropulsionType.BATTERY_ELECTRIC) {
        ineligibilityReasons.push(
          `Vehicle propulsion is not 100% Battery Electric (current: '${vehicle.propulsionType}'). Non-electric vehicles are strictly excluded.`,
        );
        exclusionCode = ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED;
      }

      // Verification status check
      if (vehicle.verificationStatus !== VehicleVerificationStatus.VERIFIED) {
        ineligibilityReasons.push(
          `Vehicle verification status is '${vehicle.verificationStatus}'. Only VERIFIED vehicles can receive dispatch offers.`,
        );
        exclusionCode = ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED;
      }

      // Active state check
      if (!vehicle.isActive) {
        ineligibilityReasons.push('Vehicle is currently deactivated in fleet inventory.');
        exclusionCode = ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED;
      }

      // Green plate commercial registration check
      if (!vehicle.greenPlateVerified) {
        ineligibilityReasons.push(
          'Vehicle commercial green plate permit has not been verified by AP transport authorities.',
        );
        exclusionCode = ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED;
      }

      // Roadworthiness (insurance, fitness, permit expiration) check
      if (!vehicle.isRoadworthy) {
        ineligibilityReasons.push(
          'Vehicle statutory compliance check failed: Commercial insurance, fitness certificate, or transport permit is expired or missing.',
        );
        exclusionCode = ApiErrorCode.DISPATCH_VEHICLE_UNAPPROVED;
      }
    }

    // 3. Validate Battery State of Charge and Telemetry Freshness
    let isTelemetryFresh = false;
    let telemetryAgeSeconds: number | null = null;
    let currentSoc = 0;
    let practicalRangeKm = 0;
    const telemetrySource = (vehicle?.rangeTelemetrySource ||
      RangeTelemetrySource.OBD_TELEMATICS) as RangeTelemetrySource;

    if (vehicle) {
      currentSoc = Number(vehicle.currentSocPercent);
      if (isNaN(currentSoc) || currentSoc < 0 || currentSoc > 100) {
        ineligibilityReasons.push(
          'Battery State of Charge is invalid or corrupt (NaN / out of range).',
        );
        if (!exclusionCode) exclusionCode = ApiErrorCode.DISPATCH_RANGE_STALE_OR_UNKNOWN;
      }

      // Check telemetry last ping timestamp
      const lastPing =
        vehicle.telemetryLastPingAt ??
        (driverProfile?.locationUpdatedAt ? new Date(driverProfile.locationUpdatedAt) : null);

      if (!lastPing) {
        ineligibilityReasons.push(
          'Battery telemetry has never been ingested (no timestamp). Live range is unknown.',
        );
        if (!exclusionCode) exclusionCode = ApiErrorCode.DISPATCH_RANGE_STALE_OR_UNKNOWN;
      } else {
        telemetryAgeSeconds = Math.max(
          0,
          Math.floor((now.getTime() - new Date(lastPing).getTime()) / 1000),
        );

        // Source-aware maximum age threshold
        const sourceMaxAge =
          TELEMETRY_SOURCE_MAX_AGE_SECONDS[telemetrySource] ?? policy.telemetryMaxAgeSeconds;
        const effectiveMaxAge = Math.max(policy.telemetryMaxAgeSeconds, sourceMaxAge);

        isTelemetryFresh = telemetryAgeSeconds <= effectiveMaxAge;
        if (!isTelemetryFresh) {
          ineligibilityReasons.push(
            `Battery telemetry is stale (${telemetryAgeSeconds}s old; maximum freshness allowed for source '${telemetrySource}' is ${effectiveMaxAge}s). Range confidence insufficient.`,
          );
          if (!exclusionCode) exclusionCode = ApiErrorCode.DISPATCH_RANGE_STALE_OR_UNKNOWN;
        }
      }

      practicalRangeKm = Math.round(Number(vehicle.ratedRangeKm) * (currentSoc / 100));
    }

    // 4. Calculate Distance Components & Energy Feasibility
    // A. Pickup distance
    let pickupDistanceKm = request.pickupDistanceKm ?? 0;
    if (
      request.pickupDistanceKm === undefined &&
      driverProfile?.currentLatitude &&
      driverProfile?.currentLongitude
    ) {
      pickupDistanceKm = this.calculateHaversineDistanceKm(
        driverProfile.currentLatitude,
        driverProfile.currentLongitude,
        request.pickupLatitude,
        request.pickupLongitude,
      );
    }

    if (pickupDistanceKm > policy.maxPickupDistanceKm) {
      ineligibilityReasons.push(
        `Transit distance to pickup (${pickupDistanceKm.toFixed(1)} km) exceeds maximum acceptable threshold (${policy.maxPickupDistanceKm} km).`,
      );
      if (!exclusionCode) exclusionCode = ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT;
    }

    // B. Passenger journey distance
    const passengerJourneyDistanceKm =
      request.tripDistanceKm ??
      this.calculateHaversineDistanceKm(
        request.pickupLatitude,
        request.pickupLongitude,
        request.dropoffLatitude,
        request.dropoffLongitude,
      );

    // C. Reserve margin
    const reserveMarginKm = policy.minReserveRangeKm;
    const reserveSocPercent = policy.minReserveSocPercent;

    // D. Charging contingency
    const nearestDepotResult = this.findNearestDepot(
      request.dropoffLatitude,
      request.dropoffLongitude,
      request.city || driverProfile?.city || vehicle?.city,
    );

    const nearestDepot = nearestDepotResult?.depot || null;
    const depotDistance = nearestDepotResult?.distanceKm ?? 0;
    const contingencyChargerDistanceKm = Math.max(
      policy.contingencyChargerDistanceKm,
      Math.round(depotDistance * 10) / 10,
    );

    // Total required range
    const totalRequiredRangeKm =
      Math.round(
        (pickupDistanceKm +
          passengerJourneyDistanceKm +
          reserveMarginKm +
          contingencyChargerDistanceKm) *
          10,
      ) / 10;

    const ratedRange = vehicle ? Number(vehicle.ratedRangeKm) : 100;
    const consumedDistanceForTrip =
      pickupDistanceKm + passengerJourneyDistanceKm + contingencyChargerDistanceKm;
    const remainingRangeAfterTripKm =
      Math.round((practicalRangeKm - consumedDistanceForTrip) * 10) / 10;

    const consumedSocPercent = (consumedDistanceForTrip / ratedRange) * 100;
    const projectedPostTripSocPercent = Math.round((currentSoc - consumedSocPercent) * 10) / 10;

    // Battery Range & SoC Sufficiency Evaluation
    if (vehicle) {
      // Must not already be below minimum reserve
      if (currentSoc < policy.minReserveSocPercent) {
        ineligibilityReasons.push(
          `Current vehicle battery SoC (${currentSoc.toFixed(1)}%) is already below minimum reserve safety threshold (${policy.minReserveSocPercent}%).`,
        );
        if (!exclusionCode) exclusionCode = ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT;
      }

      // Practical range must satisfy total required distance
      if (practicalRangeKm < totalRequiredRangeKm) {
        ineligibilityReasons.push(
          `Available practical range (${practicalRangeKm} km) is insufficient for total required mission distance (${totalRequiredRangeKm} km = pickup ${pickupDistanceKm.toFixed(1)}km + trip ${passengerJourneyDistanceKm.toFixed(1)}km + reserve ${reserveMarginKm}km + charging contingency ${contingencyChargerDistanceKm.toFixed(1)}km).`,
        );
        if (!exclusionCode) exclusionCode = ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT;
      }

      // Projected post-trip SoC must meet reserve percentage
      if (projectedPostTripSocPercent < policy.minReserveSocPercent) {
        ineligibilityReasons.push(
          `Projected post-trip battery SoC (${projectedPostTripSocPercent.toFixed(1)}%) falls below mandatory reserve margin (${policy.minReserveSocPercent}%). Risk of road stranding.`,
        );
        if (!exclusionCode) exclusionCode = ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT;
      }
    }

    const isEligible = ineligibilityReasons.length === 0;

    // 5. Construct Vehicle Battery Details
    const vehicleDetails: VehicleBatteryDetails | null = vehicle
      ? {
          vehicleId: vehicle.id,
          registrationNumber: vehicle.registrationNumber,
          propulsionType: String(vehicle.propulsionType),
          batteryCapacityKwh: Number(vehicle.batteryCapacityKwh),
          ratedRangeKm: Number(vehicle.ratedRangeKm),
          currentSocPercent: currentSoc,
          practicalRangeKm,
          rangeTelemetrySource: telemetrySource,
          telemetryAgeSeconds,
          isTelemetryFresh,
          verificationStatus: String(vehicle.verificationStatus),
          isRoadworthy: vehicle.isRoadworthy,
          greenPlateVerified: vehicle.greenPlateVerified,
        }
      : null;

    // 6. Construct Trip Distance Breakdown
    const tripDistanceBreakdown: TripDistanceBreakdown = {
      pickupDistanceKm,
      passengerJourneyDistanceKm,
      reserveMarginKm,
      reserveSocPercent,
      contingencyChargerDistanceKm,
      nearestDepot,
      totalRequiredRangeKm,
      remainingRangeAfterTripKm,
      projectedPostTripSocPercent,
    };

    // 7. Generate Documented Manual Recovery Path if Ineligible
    let manualRecoveryPath: BatteryDispatchRecoveryGuide | null = null;
    if (!isEligible) {
      manualRecoveryPath = this.buildRecoveryGuide(
        exclusionCode || ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT,
        vehicle,
        nearestDepot,
        ineligibilityReasons,
        policy,
      );
    }

    return {
      isEligible,
      exclusionCode: isEligible ? null : exclusionCode,
      ineligibilityReasons,
      vehicleDetails,
      tripDistanceBreakdown,
      manualRecoveryPath,
    };
  }

  /**
   * Generates a structured, actionable manual recovery path for captains when dispatch eligibility fails.
   */
  private buildRecoveryGuide(
    code: BatteryDispatchEvaluationResult['exclusionCode'],
    vehicle: Vehicle | null,
    depot: ChargingDepot | null,
    reasons: string[],
    policy: BatteryDispatchPolicyConfig,
  ): BatteryDispatchRecoveryGuide {
    if (code === ApiErrorCode.DISPATCH_BATTERY_INSUFFICIENT) {
      const depotName = depot ? depot.name : 'Nearest AP E-Mobility Fast Charger';
      const depotAddress = depot ? depot.address : 'Visakhapatnam Pilot Network';

      const vehiclePrefix = vehicle ? `Vehicle ${vehicle.registrationNumber}` : 'Vehicle';
      return {
        exclusionType: 'LOW_BATTERY',
        title: 'Battery Level Below Mission Safety Threshold',
        summary: `${vehiclePrefix} battery is insufficient to safely complete this trip while maintaining the mandatory ${policy.minReserveSocPercent}% reserve buffer and charging contingency.`,
        actionSteps: [
          `Proceed to ${depotName} at ${depotAddress}.`,
          'Perform a battery swap or DC fast charge until State of Charge reaches at least 80%.',
          'Open EcoRide Captain App and tap "Refresh Battery Telemetry", or submit calibrated BMS reading.',
          'Once telemetry reflects SoC >= 80%, availability for dispatch will be automatically re-enabled.',
        ],
        nearestChargingDepot: depot,
        recalibrationOrSyncEndpoint: '/v1/captains/me/battery/sync',
        supportContact: 'EcoRide Captain Operations Support: 0891-255-ECORIDE (Mon-Sun 24/7)',
      };
    }

    if (code === ApiErrorCode.DISPATCH_RANGE_STALE_OR_UNKNOWN) {
      return {
        exclusionType: 'STALE_OR_UNKNOWN_RANGE',
        title: 'Battery Telemetry Stale or Range Unknown',
        summary: `Vehicle battery telemetry was not received within the required ${policy.telemetryMaxAgeSeconds}s freshness window. Live telemetry is mandatory to prevent stranded passengers.`,
        actionSteps: [
          'Verify that the vehicle OBD-II telemetry dongle or BMS IoT gateway is powered on and flashing green.',
          'Check captain smartphone Bluetooth and cellular data connection.',
          'In Captain App, navigate to Menu -> Vehicle Status -> "Re-sync BMS Telemetry".',
          'If hardware dongle is temporarily offline, submit a manual calibrated battery reading via the Captain App.',
        ],
        nearestChargingDepot: depot,
        recalibrationOrSyncEndpoint: '/v1/captains/me/battery/sync',
        supportContact: 'EcoRide Hardware Telematics Support: 0891-255-ECORIDE (Ext 3)',
      };
    }

    // Default: UNAPPROVED_VEHICLE
    return {
      exclusionType: 'UNAPPROVED_VEHICLE',
      title: 'Vehicle EV Compliance or Roadworthiness Incomplete',
      summary:
        reasons[0] ||
        'Vehicle has not met mandatory AP green-plate commercial electric mobility standards.',
      actionSteps: [
        'Ensure the vehicle is a 100% Battery Electric Vehicle (BEV) with valid AP green commercial plates.',
        'Upload updated commercial insurance, fitness certificate, and AP RTO pilot transport permit via the Captain App.',
        'Wait for EcoRide Fleet Compliance Officer review and approval (typically within 2 business hours).',
        'Contact dispatch operations if verification is delayed.',
      ],
      nearestChargingDepot: depot,
      recalibrationOrSyncEndpoint: '/v1/compliance/captains/me/reverify',
      supportContact: 'EcoRide Fleet Compliance Desk: compliance@ecoride.ap.gov.in',
    };
  }

  /**
   * Manual recovery action: Captain submits refreshed/calibrated battery telemetry
   * after battery swap, depot fast-charge, or manual instrument cluster reading.
   */
  async syncCaptainBattery(
    actor: CurrentActorPayload,
    targetUserId: string,
    dto: CaptainBatterySyncRequest,
  ): Promise<CaptainBatterySyncResponse> {
    this.assertCanAccessCaptain(actor, targetUserId, 'SYNC_CAPTAIN_BATTERY');

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

    if (!driverProfile.assignedVehicle && !driverProfile.assignedVehicleId) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'No EV vehicle is currently assigned to this captain profile.',
      });
    }

    const vehicle =
      driverProfile.assignedVehicle ||
      (await this.vehicleRepository.findOne({
        where: { id: driverProfile.assignedVehicleId },
      }));

    if (!vehicle) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: 'Assigned vehicle record not found in fleet database.',
      });
    }

    const previousSoc = Number(vehicle.currentSocPercent);
    const now = new Date();

    // Update vehicle entity
    vehicle.currentSocPercent = dto.currentSocPercent;
    vehicle.rangeTelemetrySource =
      dto.rangeTelemetrySource || RangeTelemetrySource.MANUAL_TELEMETRY;
    if (dto.telemetryDeviceId) {
      vehicle.telemetryDeviceId = dto.telemetryDeviceId;
    }
    vehicle.telemetryLastPingAt = now;
    await this.vehicleRepository.save(vehicle);

    // Update driver profile battery cache
    driverProfile.batterySocPercent = dto.currentSocPercent;
    driverProfile.locationUpdatedAt = now;
    await this.driverProfileRepository.save(driverProfile);

    const practicalRange = Math.round(Number(vehicle.ratedRangeKm) * (dto.currentSocPercent / 100));

    this.logger.log(
      `Captain ${driverProfile.id} synced battery SoC: ${previousSoc}% -> ${dto.currentSocPercent}% via ${vehicle.rangeTelemetrySource}. Estimated range: ${practicalRange} km.`,
    );

    return {
      captainId: driverProfile.id,
      vehicleId: vehicle.id,
      previousSocPercent: previousSoc,
      currentSocPercent: dto.currentSocPercent,
      estimatedRangeKm: practicalRange,
      syncedAt: now.toISOString(),
      source: String(vehicle.rangeTelemetrySource),
      message: 'Vehicle battery telemetry synced successfully. Dispatch eligibility recalculated.',
    };
  }
}
