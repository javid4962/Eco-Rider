import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import { User } from '../../database/entities/user.entity';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleTelemetryDto,
  VerifyVehicleDto,
  VehiclesPaginationDto,
  ValidateVehicleOperationDto,
} from './dto';
import {
  PropulsionType,
  DISALLOWED_PROPULSION_TYPES,
  VehicleCategory,
  VehicleServiceClass,
  VehicleVerificationStatus,
  VehicleDto,
  PaginatedVehiclesDto,
  VehicleComplianceDto,
  PlatformRole,
  SeatingCapacityBreakdown,
  CATEGORY_SEATING_LIMITS,
  CATEGORY_TO_SERVICE_CLASS,
  CITY_PERMITTED_CATEGORIES,
  VehicleOperationValidationResultDto,
} from '@ecoride/contracts';
import { CurrentActorPayload } from '../identity/current-actor.decorator';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  // Maximum allowed passenger seating per vehicle category
  public static readonly MAX_SEATING_BY_CATEGORY: Record<VehicleCategory, number> = {
    [VehicleCategory.CITY_COMMUTE_2W]:
      CATEGORY_SEATING_LIMITS[VehicleCategory.CITY_COMMUTE_2W].maxSeats,
    [VehicleCategory.AUTO_COMMUTE_3W]:
      CATEGORY_SEATING_LIMITS[VehicleCategory.AUTO_COMMUTE_3W].maxSeats,
    [VehicleCategory.CAB_PRIVATE_4W]:
      CATEGORY_SEATING_LIMITS[VehicleCategory.CAB_PRIVATE_4W].maxSeats,
    [VehicleCategory.VAN_COMMUTE_4W]:
      CATEGORY_SEATING_LIMITS[VehicleCategory.VAN_COMMUTE_4W].maxSeats,
  };

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Authoritative derivation of legal passenger capacity accounting for driver separately.
   * Defines 'D+3' strictly as 1 driver seat and 3 customer seats (total legal seating capacity = 4).
   */
  public static deriveSeatingCapacity(input: {
    seatingConfiguration?: string;
    approvedPassengerSeating?: number;
    totalSeatingCapacity?: number;
    vehicleCategory?: VehicleCategory | string;
  }): SeatingCapacityBreakdown {
    let customerSeats: number | undefined;

    if (input.seatingConfiguration && input.seatingConfiguration.trim().length > 0) {
      const match = input.seatingConfiguration.trim().match(/^D\+(\d+)$/i);
      if (!match) {
        throw new BadRequestException(
          `Invalid seating configuration '${input.seatingConfiguration}'. Must follow standard AP commercial transport notation 'D+X' (e.g. D+1, D+3, D+4, D+7).`,
        );
      }
      customerSeats = parseInt(match[1], 10);
    } else if (input.totalSeatingCapacity !== undefined && input.totalSeatingCapacity !== null) {
      // Total seats includes 1 driver seat, so customer seats = total - 1
      if (input.totalSeatingCapacity < 2) {
        throw new BadRequestException(
          `Total seating capacity must be at least 2 (1 driver seat + at least 1 customer seat).`,
        );
      }
      customerSeats = input.totalSeatingCapacity - 1;
    } else if (
      input.approvedPassengerSeating !== undefined &&
      input.approvedPassengerSeating !== null
    ) {
      customerSeats = input.approvedPassengerSeating;
    } else if (input.vehicleCategory) {
      const limits = CATEGORY_SEATING_LIMITS[input.vehicleCategory as VehicleCategory];
      customerSeats = limits ? limits.defaultSeats : 1;
    } else {
      customerSeats = 1;
    }

    if (customerSeats < 1) {
      throw new BadRequestException(
        `Legal passenger capacity must be at least 1 customer seat. Provided: ${customerSeats}`,
      );
    }
    if (customerSeats > 10) {
      throw new BadRequestException(
        `Legal passenger capacity cannot exceed 10 customer seats for commercial EV transport. Provided: ${customerSeats}`,
      );
    }

    const category = input.vehicleCategory as VehicleCategory;
    if (category && CATEGORY_SEATING_LIMITS[category]) {
      const limits = CATEGORY_SEATING_LIMITS[category];
      if (customerSeats > limits.maxSeats) {
        throw new BadRequestException(
          `Over-capacity: Vehicle category '${category}' cannot exceed ${limits.maxSeats} customer seats (${limits.defaultNotation}); exceeds the maximum allowed limit of ${limits.maxSeats}. Provided: ${customerSeats} customer seats (D+${customerSeats}).`,
        );
      }
      if (customerSeats < limits.minSeats) {
        throw new BadRequestException(
          `Under-capacity: Vehicle category '${category}' requires at least ${limits.minSeats} customer seats. Provided: ${customerSeats}.`,
        );
      }
    }

    return {
      seatingConfiguration: `D+${customerSeats}`,
      driverSeatCount: 1,
      legalPassengerCapacity: customerSeats,
      totalSeatingCapacity: customerSeats + 1,
    };
  }

  /**
   * Validates service class and city matching per Rule 2 & 3:
   * Category availability must be enforced server-side by city.
   */
  public assertServiceClassCityCompatibility(
    vehicleCategory: VehicleCategory | string,
    city: string,
  ): void {
    const normCity = city ? city.toLowerCase().trim() : 'visakhapatnam';
    const permittedCategories = CITY_PERMITTED_CATEGORIES[normCity];

    if (!permittedCategories) {
      throw new BadRequestException(
        `Incompatible service class: Operational city '${city}' is not recognized in Andhra Pradesh EV pilot network.`,
      );
    }

    if (permittedCategories.length === 0) {
      throw new BadRequestException(
        `Incompatible service class: City '${city}' has no authorized commercial EV categories. Commercial EV operations are currently disabled pending municipal launch gates.`,
      );
    }

    const cat = vehicleCategory as VehicleCategory;
    if (!permittedCategories.includes(cat)) {
      throw new BadRequestException(
        `Incompatible service class: Vehicle category '${vehicleCategory}' is not authorized for commercial operations in city '${city}'. Permitted categories in '${city}': ${permittedCategories.join(', ')}.`,
      );
    }
  }

  /**
   * Authoritative server-side propulsion validation.
   * Explicitly rejects PETROL, DIESEL, CNG, HYBRID, and any other non-electric propulsion type.
   * Cannot be bypassed by tampering with Flutter client JSON requests.
   */
  public assertElectricPropulsion(propulsionType?: string): void {
    if (!propulsionType) {
      return; // Defaults to BATTERY_ELECTRIC in entity / DTO
    }

    const normalized = propulsionType.toUpperCase().trim();

    // Check against disallowed list or anything other than BATTERY_ELECTRIC
    const isExplicitlyDisallowed = DISALLOWED_PROPULSION_TYPES.some(
      (disallowed) => disallowed === normalized,
    );

    if (isExplicitlyDisallowed || normalized !== PropulsionType.BATTERY_ELECTRIC) {
      this.logger.warn(
        `SECURITY ALERT: Non-electric vehicle registration rejected. Attempted propulsion: '${propulsionType}'`,
      );
      throw new BadRequestException(
        `Non-electric propulsion '${propulsionType}' is strictly prohibited. EcoRide is an EV-only electric mobility platform in Andhra Pradesh and accepts only '${PropulsionType.BATTERY_ELECTRIC}' vehicles.`,
      );
    }
  }

  /**
   * Registers a new verified electric vehicle.
   * Validates electric propulsion server-side, seating rules, and uniqueness.
   */
  async createVehicle(actor: CurrentActorPayload, dto: CreateVehicleDto): Promise<VehicleDto> {
    // 1. Authoritative electric propulsion assertion
    this.assertElectricPropulsion(dto.propulsionType);

    // 2. Validate registration number is non-empty and non-blank
    if (!dto.registrationNumber || dto.registrationNumber.trim().length === 0) {
      throw new BadRequestException('Vehicle registration number is required and cannot be empty.');
    }
    const regNumber = dto.registrationNumber.toUpperCase().trim();
    const existing = await this.vehicleRepository.findOne({
      where: { registrationNumber: regNumber },
    });
    if (existing) {
      throw new ConflictException(
        `A vehicle with registration number '${regNumber}' is already registered in the system`,
      );
    }

    // 3. Derive legal passenger capacity accounting for driver separately (e.g. D+3 derives 3 customer seats + 1 driver)
    const seating = VehiclesService.deriveSeatingCapacity({
      seatingConfiguration: dto.seatingConfiguration,
      approvedPassengerSeating: dto.approvedPassengerSeating,
      totalSeatingCapacity: dto.totalSeatingCapacity,
      vehicleCategory: dto.vehicleCategory,
    });

    // 4. Validate service class and city compatibility
    const city = dto.city ? dto.city.toLowerCase().trim() : 'visakhapatnam';
    this.assertServiceClassCityCompatibility(dto.vehicleCategory, city);

    // 5. Determine commercial service class
    const serviceClass =
      dto.serviceClass ??
      CATEGORY_TO_SERVICE_CLASS[dto.vehicleCategory] ??
      VehicleServiceClass.ECO_BIKE;

    // 6. Resolve vehicle owner
    let ownerId = actor.id;
    const isAdminOrFleet = this.hasAdminOrFleetPrivileges(actor);
    if (isAdminOrFleet && dto.ownerId) {
      const ownerExists = await this.userRepository.findOne({ where: { id: dto.ownerId } });
      if (!ownerExists) {
        throw new NotFoundException(`Designated owner with user ID '${dto.ownerId}' was not found`);
      }
      ownerId = dto.ownerId;
    }

    // 7. Determine initial verification status
    // Operators and Super Admins can directly register verified vehicles
    const initialStatus =
      isAdminOrFleet && dto.greenPlateVerified
        ? VehicleVerificationStatus.VERIFIED
        : VehicleVerificationStatus.PENDING_VERIFICATION;

    // 8. Create and persist entity
    const vehicle = this.vehicleRepository.create({
      registrationNumber: regNumber,
      propulsionType: PropulsionType.BATTERY_ELECTRIC,
      vehicleCategory: dto.vehicleCategory,
      serviceClass,
      seatingConfiguration: seating.seatingConfiguration,
      approvedPassengerSeating: seating.legalPassengerCapacity,
      totalSeatingCapacity: seating.totalSeatingCapacity,
      make: dto.make,
      model: dto.model,
      yearOfManufacture: dto.yearOfManufacture,
      batteryCapacityKwh: dto.batteryCapacityKwh,
      currentSocPercent: dto.currentSocPercent ?? 100.0,
      ratedRangeKm: dto.ratedRangeKm,
      rangeTelemetrySource: dto.rangeTelemetrySource,
      telemetryDeviceId: dto.telemetryDeviceId,
      ownerId,
      insurancePolicyNumber: dto.insurancePolicyNumber,
      insuranceExpiryDate: dto.insuranceExpiryDate ? new Date(dto.insuranceExpiryDate) : null,
      fitnessCertificateNumber: dto.fitnessCertificateNumber,
      fitnessExpiryDate: dto.fitnessExpiryDate ? new Date(dto.fitnessExpiryDate) : null,
      commercialPermitNumber: dto.commercialPermitNumber,
      commercialPermitExpiry: dto.commercialPermitExpiry
        ? new Date(dto.commercialPermitExpiry)
        : null,
      greenPlateVerified: dto.greenPlateVerified ?? true,
      verificationStatus: initialStatus,
      city,
      isActive: true,
    });

    const saved = await this.vehicleRepository.save(vehicle);

    // 9. Authoritative audit trail
    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: ownerId,
      action: 'VEHICLE_REGISTERED',
      entityType: 'VEHICLE',
      entityId: saved.id,
      status: 'SUCCESS',
      newState: {
        registrationNumber: saved.registrationNumber,
        propulsionType: saved.propulsionType,
        vehicleCategory: saved.vehicleCategory,
        serviceClass: saved.serviceClass,
        seatingConfiguration: saved.seatingConfiguration,
        legalPassengerCapacity: saved.approvedPassengerSeating,
        totalSeatingCapacity: saved.totalSeatingCapacity,
        make: saved.make,
        model: saved.model,
        verificationStatus: saved.verificationStatus,
      },
    });

    return this.mapToDto(saved);
  }

  /**
   * Updates an existing electric vehicle record.
   * Server-side check strictly prevents updating propulsion to non-electric.
   * Validates capacity changes and service class/city matching.
   */
  async updateVehicle(
    actor: CurrentActorPayload,
    id: string,
    dto: UpdateVehicleDto,
  ): Promise<VehicleDto> {
    // 1. Authoritative electric propulsion check on update
    if (dto.propulsionType !== undefined) {
      this.assertElectricPropulsion(dto.propulsionType);
    }

    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${id}' was not found`);
    }

    // 2. Ownership / permission assertion
    this.assertCanManageVehicle(actor, vehicle);

    // 3. Category & capacity check
    const targetCategory = (dto.vehicleCategory ?? vehicle.vehicleCategory) as VehicleCategory;
    const targetCity = dto.city ? dto.city.toLowerCase().trim() : vehicle.city;

    // Validate service class / city matching if category or city is modified
    if (dto.vehicleCategory || dto.city) {
      this.assertServiceClassCityCompatibility(targetCategory, targetCity);
    }

    // Derive seating if any capacity parameter or category changed
    let seating: SeatingCapacityBreakdown = {
      seatingConfiguration: vehicle.seatingConfiguration,
      driverSeatCount: 1,
      legalPassengerCapacity: vehicle.approvedPassengerSeating,
      totalSeatingCapacity: vehicle.totalSeatingCapacity,
    };

    const hasCapacityChange =
      dto.seatingConfiguration !== undefined ||
      dto.approvedPassengerSeating !== undefined ||
      dto.totalSeatingCapacity !== undefined ||
      dto.vehicleCategory !== undefined;

    if (hasCapacityChange) {
      seating = VehiclesService.deriveSeatingCapacity({
        seatingConfiguration: dto.seatingConfiguration ?? vehicle.seatingConfiguration,
        approvedPassengerSeating: dto.approvedPassengerSeating,
        totalSeatingCapacity: dto.totalSeatingCapacity,
        vehicleCategory: targetCategory,
      });
    }

    const previousCapacityState = {
      seatingConfiguration: vehicle.seatingConfiguration,
      legalPassengerCapacity: vehicle.approvedPassengerSeating,
      totalSeatingCapacity: vehicle.totalSeatingCapacity,
      vehicleCategory: vehicle.vehicleCategory,
      serviceClass: vehicle.serviceClass,
    };

    const previousState = {
      make: vehicle.make,
      model: vehicle.model,
      vehicleCategory: vehicle.vehicleCategory,
      serviceClass: vehicle.serviceClass,
      seatingConfiguration: vehicle.seatingConfiguration,
      currentSocPercent: vehicle.currentSocPercent,
      isActive: vehicle.isActive,
      verificationStatus: vehicle.verificationStatus,
    };

    // 4. Apply updates
    vehicle.vehicleCategory = targetCategory;
    vehicle.serviceClass =
      dto.serviceClass ?? CATEGORY_TO_SERVICE_CLASS[targetCategory] ?? VehicleServiceClass.ECO_BIKE;
    vehicle.seatingConfiguration = seating.seatingConfiguration;
    vehicle.approvedPassengerSeating = seating.legalPassengerCapacity;
    vehicle.totalSeatingCapacity = seating.totalSeatingCapacity;
    vehicle.city = targetCity;

    if (dto.make) vehicle.make = dto.make;
    if (dto.model) vehicle.model = dto.model;
    if (dto.yearOfManufacture) vehicle.yearOfManufacture = dto.yearOfManufacture;
    if (dto.batteryCapacityKwh !== undefined) vehicle.batteryCapacityKwh = dto.batteryCapacityKwh;
    if (dto.currentSocPercent !== undefined) vehicle.currentSocPercent = dto.currentSocPercent;
    if (dto.ratedRangeKm !== undefined) vehicle.ratedRangeKm = dto.ratedRangeKm;
    if (dto.rangeTelemetrySource) vehicle.rangeTelemetrySource = dto.rangeTelemetrySource;
    if (dto.telemetryDeviceId !== undefined) vehicle.telemetryDeviceId = dto.telemetryDeviceId;
    if (dto.insurancePolicyNumber !== undefined)
      vehicle.insurancePolicyNumber = dto.insurancePolicyNumber;
    if (dto.insuranceExpiryDate !== undefined)
      vehicle.insuranceExpiryDate = dto.insuranceExpiryDate
        ? new Date(dto.insuranceExpiryDate)
        : null;
    if (dto.fitnessCertificateNumber !== undefined)
      vehicle.fitnessCertificateNumber = dto.fitnessCertificateNumber;
    if (dto.fitnessExpiryDate !== undefined)
      vehicle.fitnessExpiryDate = dto.fitnessExpiryDate ? new Date(dto.fitnessExpiryDate) : null;
    if (dto.commercialPermitNumber !== undefined)
      vehicle.commercialPermitNumber = dto.commercialPermitNumber;
    if (dto.commercialPermitExpiry !== undefined)
      vehicle.commercialPermitExpiry = dto.commercialPermitExpiry
        ? new Date(dto.commercialPermitExpiry)
        : null;
    if (dto.isActive !== undefined) vehicle.isActive = dto.isActive;

    // Green plate and owner reassignment require admin privileges
    if (dto.greenPlateVerified !== undefined && this.hasAdminOrFleetPrivileges(actor)) {
      vehicle.greenPlateVerified = dto.greenPlateVerified;
    }
    if (dto.ownerId !== undefined && this.hasAdminOrFleetPrivileges(actor)) {
      vehicle.ownerId = dto.ownerId;
    }

    const saved = await this.vehicleRepository.save(vehicle);

    // 5. Audit logs: Record VEHICLE_CAPACITY_CHANGED specifically when capacity/seating is updated
    if (
      hasCapacityChange &&
      (previousCapacityState.legalPassengerCapacity !== saved.approvedPassengerSeating ||
        previousCapacityState.seatingConfiguration !== saved.seatingConfiguration ||
        previousCapacityState.vehicleCategory !== saved.vehicleCategory)
    ) {
      await this.recordAuditEvent({
        actorId: actor.id,
        targetUserId: vehicle.ownerId ?? undefined,
        action: 'VEHICLE_CAPACITY_CHANGED',
        entityType: 'VEHICLE',
        entityId: saved.id,
        status: 'SUCCESS',
        previousState: previousCapacityState,
        newState: {
          seatingConfiguration: saved.seatingConfiguration,
          legalPassengerCapacity: saved.approvedPassengerSeating,
          totalSeatingCapacity: saved.totalSeatingCapacity,
          vehicleCategory: saved.vehicleCategory,
          serviceClass: saved.serviceClass,
        },
      });
    }

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: vehicle.ownerId ?? undefined,
      action: 'VEHICLE_UPDATED',
      entityType: 'VEHICLE',
      entityId: saved.id,
      status: 'SUCCESS',
      previousState,
      newState: {
        make: saved.make,
        model: saved.model,
        vehicleCategory: saved.vehicleCategory,
        serviceClass: saved.serviceClass,
        seatingConfiguration: saved.seatingConfiguration,
        currentSocPercent: saved.currentSocPercent,
        isActive: saved.isActive,
      },
    });

    return this.mapToDto(saved);
  }

  /**
   * Operational readiness and classification validation for dispatch / bookings.
   * Blocks operation on over-capacity, incompatible service class, or missing/unverified registration.
   */
  async validateVehicleOperation(
    vehicleId: string,
    request: ValidateVehicleOperationDto,
  ): Promise<VehicleOperationValidationResultDto> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${vehicleId}' was not found`);
    }

    const blockers: string[] = [];

    // 1. Missing registration check
    if (!vehicle.registrationNumber || vehicle.registrationNumber.trim().length === 0) {
      blockers.push('MISSING_REGISTRATION: Vehicle registration plate is missing or empty.');
    } else if (
      !vehicle.greenPlateVerified ||
      vehicle.verificationStatus !== VehicleVerificationStatus.VERIFIED
    ) {
      blockers.push(
        `UNVERIFIED_REGISTRATION: Green-plate commercial registration for '${vehicle.registrationNumber}' has not been verified by platform operations.`,
      );
    }

    // 2. Over-capacity check
    if (request.requestedSeats !== undefined && request.requestedSeats !== null) {
      if (request.requestedSeats > vehicle.legalPassengerCapacity) {
        blockers.push(
          `OVER_CAPACITY: Requested ${request.requestedSeats} customer seats exceeds legal passenger capacity of ${vehicle.legalPassengerCapacity} (${vehicle.seatingConfiguration}).`,
        );
      }
    }

    // 3. Service class compatibility check
    if (request.serviceClass) {
      const normRequested = request.serviceClass.toUpperCase().trim();
      const matchesCategory = normRequested === vehicle.vehicleCategory;
      const matchesServiceClass = normRequested === vehicle.serviceClass;
      if (!matchesCategory && !matchesServiceClass) {
        blockers.push(
          `INCOMPATIBLE_SERVICE_CLASS: Requested service class '${request.serviceClass}' cannot be served by vehicle category '${vehicle.vehicleCategory}' (${vehicle.serviceClass}).`,
        );
      }
    }

    // 4. City matching check
    if (request.city) {
      const normCity = request.city.toLowerCase().trim();
      if (normCity !== vehicle.city.toLowerCase()) {
        blockers.push(
          `INCOMPATIBLE_CITY: Vehicle is registered for operation in '${vehicle.city}', but service was requested in '${request.city}'.`,
        );
      }
    }

    // 5. City category authorization
    const permittedInCity = CITY_PERMITTED_CATEGORIES[vehicle.city.toLowerCase()] ?? [];
    if (!permittedInCity.includes(vehicle.vehicleCategory as VehicleCategory)) {
      blockers.push(
        `INCOMPATIBLE_SERVICE_CLASS_CITY: Category '${vehicle.vehicleCategory}' is not authorized for commercial operations in city '${vehicle.city}'.`,
      );
    }

    // 6. Roadworthiness & Active state
    if (!vehicle.isActive) {
      blockers.push('VEHICLE_INACTIVE: Vehicle record is currently deactivated.');
    }
    if (!vehicle.isRoadworthy) {
      blockers.push(
        'VEHICLE_NOT_ROADWORTHY: Vehicle is not roadworthy (insurance, fitness, or permit expired).',
      );
    }

    return {
      vehicleId: vehicle.id,
      canOperate: blockers.length === 0,
      registrationNumber: vehicle.registrationNumber,
      propulsionType: vehicle.propulsionType,
      vehicleCategory: vehicle.vehicleCategory,
      serviceClass: vehicle.serviceClass,
      seatingConfiguration: vehicle.seatingConfiguration,
      driverSeatCount: vehicle.driverSeatCount,
      legalPassengerCapacity: vehicle.legalPassengerCapacity,
      totalSeatingCapacity: vehicle.totalSeatingCapacity,
      city: vehicle.city,
      blockers,
    };
  }

  /**
   * Fetches single vehicle details by ID with roadworthiness and calculated range.
   */
  async getVehicle(id: string): Promise<VehicleDto> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${id}' was not found`);
    }
    return this.mapToDto(vehicle);
  }

  /**
   * Lists vehicles with filtering by category, city, verification status, and owner.
   */
  async listVehicles(query: VehiclesPaginationDto): Promise<PaginatedVehiclesDto> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = this.vehicleRepository.createQueryBuilder('vehicle');

    if (query.category) {
      qb.andWhere('vehicle.vehicle_category = :category', { category: query.category });
    }
    if (query.city) {
      qb.andWhere('LOWER(vehicle.city) = LOWER(:city)', { city: query.city });
    }
    if (query.verificationStatus) {
      qb.andWhere('vehicle.verification_status = :status', { status: query.verificationStatus });
    }
    if (query.ownerId) {
      qb.andWhere('vehicle.owner_id = :ownerId', { ownerId: query.ownerId });
    }

    qb.orderBy('vehicle.created_at', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((v) => this.mapToDto(v)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Platform operator or Fleet Manager endpoint to verify or reject vehicle EV status.
   */
  async verifyVehicle(
    actor: CurrentActorPayload,
    id: string,
    dto: VerifyVehicleDto,
  ): Promise<VehicleDto> {
    if (!this.hasAdminOrFleetPrivileges(actor) && !actor.scopes.includes('vehicle:verify')) {
      throw new ForbiddenException(
        'Access denied: Only platform operators and fleet administrators can verify vehicles',
      );
    }

    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${id}' was not found`);
    }

    const previousStatus = vehicle.verificationStatus;
    vehicle.verificationStatus = dto.status;
    vehicle.rejectionReason = dto.rejectionReason ?? null;
    if (dto.greenPlateVerified !== undefined) {
      vehicle.greenPlateVerified = dto.greenPlateVerified;
    }

    const saved = await this.vehicleRepository.save(vehicle);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: vehicle.ownerId ?? undefined,
      action: 'VEHICLE_VERIFICATION_STATUS_CHANGED',
      entityType: 'VEHICLE',
      entityId: saved.id,
      status: 'SUCCESS',
      previousState: { verificationStatus: previousStatus },
      newState: {
        verificationStatus: saved.verificationStatus,
        rejectionReason: saved.rejectionReason,
        greenPlateVerified: saved.greenPlateVerified,
      },
    });

    return this.mapToDto(saved);
  }

  /**
   * Ingests real-time battery State of Charge and range telemetry from IoT BMS or telematics.
   */
  async updateTelemetry(id: string, dto: VehicleTelemetryDto): Promise<VehicleDto> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${id}' was not found`);
    }

    vehicle.currentSocPercent = dto.currentSocPercent;
    if (dto.rangeTelemetrySource) {
      vehicle.rangeTelemetrySource = dto.rangeTelemetrySource;
    }
    if (dto.telemetryDeviceId) {
      vehicle.telemetryDeviceId = dto.telemetryDeviceId;
    }
    vehicle.telemetryLastPingAt = new Date();

    const saved = await this.vehicleRepository.save(vehicle);
    return this.mapToDto(saved);
  }

  /**
   * Real-time regulatory breakdown of vehicle compliance (insurance, fitness, green plate, permit).
   */
  async getCompliance(id: string): Promise<VehicleComplianceDto> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${id}' was not found`);
    }

    const now = new Date();
    const issues: string[] = [];

    // 1. Insurance check
    let insuranceValid = false;
    let insuranceDaysRemaining: number | null = null;
    if (vehicle.insuranceExpiryDate) {
      const expiry = new Date(vehicle.insuranceExpiryDate);
      insuranceDaysRemaining = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      insuranceValid = insuranceDaysRemaining > 0;
      if (!insuranceValid) {
        issues.push(`Commercial insurance expired on ${expiry.toISOString().split('T')[0]}`);
      }
    } else {
      issues.push('Missing commercial insurance certificate');
    }

    // 2. Fitness check
    let fitnessValid = false;
    let fitnessDaysRemaining: number | null = null;
    if (vehicle.fitnessExpiryDate) {
      const expiry = new Date(vehicle.fitnessExpiryDate);
      fitnessDaysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      fitnessValid = fitnessDaysRemaining > 0;
      if (!fitnessValid) {
        issues.push(
          `RTO transport fitness certificate expired on ${expiry.toISOString().split('T')[0]}`,
        );
      }
    } else {
      issues.push('Missing RTO transport fitness certificate');
    }

    // 3. Commercial Permit check
    let commercialPermitValid = false;
    let commercialPermitDaysRemaining: number | null = null;
    if (vehicle.commercialPermitExpiry) {
      const expiry = new Date(vehicle.commercialPermitExpiry);
      commercialPermitDaysRemaining = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      commercialPermitValid = commercialPermitDaysRemaining > 0;
      if (!commercialPermitValid) {
        issues.push(
          `AP Green-Plate commercial transport permit expired on ${expiry.toISOString().split('T')[0]}`,
        );
      }
    } else {
      issues.push('Missing AP Green-Plate commercial transport permit');
    }

    // 4. Green plate check
    const greenPlateVerified = Boolean(vehicle.greenPlateVerified);
    if (!greenPlateVerified) {
      issues.push('AP RTO Green Plate has not been verified');
    }

    // 5. Propulsion check
    const propulsionValid = vehicle.propulsionType === PropulsionType.BATTERY_ELECTRIC;
    if (!propulsionValid) {
      issues.push(`Non-electric propulsion '${vehicle.propulsionType}' is prohibited`);
    }

    // 6. Overall compliance
    const isCompliant =
      insuranceValid &&
      fitnessValid &&
      commercialPermitValid &&
      greenPlateVerified &&
      propulsionValid &&
      vehicle.verificationStatus === VehicleVerificationStatus.VERIFIED &&
      vehicle.isActive;

    return {
      vehicleId: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      isCompliant,
      insuranceValid,
      insuranceDaysRemaining,
      fitnessValid,
      fitnessDaysRemaining,
      commercialPermitValid,
      commercialPermitDaysRemaining,
      greenPlateVerified,
      propulsionValid,
      issues,
    };
  }

  // ---------------------------------------------------------------------------
  // Helper & Permission Methods
  // ---------------------------------------------------------------------------

  private assertCanManageVehicle(actor: CurrentActorPayload, vehicle: Vehicle): void {
    if (actor.id === vehicle.ownerId) {
      return;
    }
    if (this.hasAdminOrFleetPrivileges(actor)) {
      return;
    }
    throw new ForbiddenException(
      `Access denied: You do not have permission to manage vehicle '${vehicle.registrationNumber}'`,
    );
  }

  private hasAdminOrFleetPrivileges(actor: CurrentActorPayload): boolean {
    const adminRoles = [
      PlatformRole.SUPER_ADMIN,
      PlatformRole.OPERATOR,
      PlatformRole.FLEET,
      PlatformRole.FLEET_OWNER,
    ];
    return (
      adminRoles.includes(actor.role as PlatformRole) ||
      actor.scopes.includes('*') ||
      actor.scopes.includes('vehicle:write') ||
      actor.scopes.includes('fleet:manage')
    );
  }

  private mapToDto(v: Vehicle): VehicleDto {
    return {
      id: v.id,
      registrationNumber: v.registrationNumber,
      propulsionType: v.propulsionType,
      vehicleCategory: v.vehicleCategory,
      serviceClass:
        v.serviceClass ||
        (CATEGORY_TO_SERVICE_CLASS[v.vehicleCategory as VehicleCategory] ??
          VehicleServiceClass.ECO_BIKE),
      seatingConfiguration: v.seatingConfiguration || `D+${v.approvedPassengerSeating || 1}`,
      driverSeatCount: 1,
      legalPassengerCapacity: Number(v.approvedPassengerSeating),
      totalSeatingCapacity: Number(
        v.totalSeatingCapacity || Number(v.approvedPassengerSeating) + 1,
      ),
      approvedPassengerSeating: Number(v.approvedPassengerSeating),
      make: v.make,
      model: v.model,
      yearOfManufacture: Number(v.yearOfManufacture),
      batteryCapacityKwh: Number(v.batteryCapacityKwh),
      currentSocPercent: Number(v.currentSocPercent),
      ratedRangeKm: Number(v.ratedRangeKm),
      estimatedRangeKm: v.estimatedRangeKm,
      rangeTelemetrySource: v.rangeTelemetrySource,
      telemetryDeviceId: v.telemetryDeviceId,
      telemetryLastPingAt: v.telemetryLastPingAt ? v.telemetryLastPingAt.toISOString() : null,
      ownerId: v.ownerId,
      insurancePolicyNumber: v.insurancePolicyNumber,
      insuranceExpiryDate: v.insuranceExpiryDate ? v.insuranceExpiryDate.toISOString() : null,
      fitnessCertificateNumber: v.fitnessCertificateNumber,
      fitnessExpiryDate: v.fitnessExpiryDate ? v.fitnessExpiryDate.toISOString() : null,
      commercialPermitNumber: v.commercialPermitNumber,
      commercialPermitExpiry: v.commercialPermitExpiry
        ? v.commercialPermitExpiry.toISOString()
        : null,
      greenPlateVerified: Boolean(v.greenPlateVerified),
      verificationStatus: v.verificationStatus,
      rejectionReason: v.rejectionReason,
      isRoadworthy: v.isRoadworthy,
      city: v.city,
      isActive: Boolean(v.isActive),
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    };
  }

  private async recordAuditEvent(params: {
    actorId?: string;
    targetUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    status: 'SUCCESS' | 'DENIED' | 'FAILED';
    failureReason?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const event = this.auditEventRepository.create({
        actorId: params.actorId,
        targetUserId: params.targetUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        status: params.status,
        failureReason: params.failureReason,
        previousState: params.previousState,
        newState: params.newState,
      });
      await this.auditEventRepository.save(event);
    } catch (err) {
      this.logger.warn(`Failed to record vehicle audit event: ${err}`);
    }
  }
}
