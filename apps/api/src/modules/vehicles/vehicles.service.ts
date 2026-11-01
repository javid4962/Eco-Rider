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
} from './dto';
import {
  PropulsionType,
  DISALLOWED_PROPULSION_TYPES,
  VehicleCategory,
  VehicleVerificationStatus,
  VehicleDto,
  PaginatedVehiclesDto,
  VehicleComplianceDto,
  PlatformRole,
} from '@ecoride/contracts';
import { CurrentActorPayload } from '../identity/current-actor.decorator';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  // Maximum allowed passenger seating per vehicle category
  private static readonly MAX_SEATING_BY_CATEGORY: Record<VehicleCategory, number> = {
    [VehicleCategory.CITY_COMMUTE_2W]: 1,
    [VehicleCategory.AUTO_COMMUTE_3W]: 3,
    [VehicleCategory.CAB_PRIVATE_4W]: 4,
    [VehicleCategory.VAN_COMMUTE_4W]: 10,
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

    // 2. Normalize and check registration number uniqueness
    const regNumber = dto.registrationNumber.toUpperCase().trim();
    const existing = await this.vehicleRepository.findOne({
      where: { registrationNumber: regNumber },
    });
    if (existing) {
      throw new ConflictException(
        `A vehicle with registration number '${regNumber}' is already registered in the system`,
      );
    }

    // 3. Category seating limits validation
    const maxSeating =
      VehiclesService.MAX_SEATING_BY_CATEGORY[dto.vehicleCategory as VehicleCategory] ?? 4;
    if (dto.approvedPassengerSeating > maxSeating) {
      throw new BadRequestException(
        `Approved passenger seating of ${dto.approvedPassengerSeating} exceeds the maximum allowed limit of ${maxSeating} for category '${dto.vehicleCategory}'`,
      );
    }

    // 4. Resolve vehicle owner
    let ownerId = actor.id;
    const isAdminOrFleet = this.hasAdminOrFleetPrivileges(actor);
    if (isAdminOrFleet && dto.ownerId) {
      const ownerExists = await this.userRepository.findOne({ where: { id: dto.ownerId } });
      if (!ownerExists) {
        throw new NotFoundException(`Designated owner with user ID '${dto.ownerId}' was not found`);
      }
      ownerId = dto.ownerId;
    }

    // 5. Determine initial verification status
    // Operators and Super Admins can directly register verified vehicles
    const initialStatus =
      isAdminOrFleet && dto.greenPlateVerified
        ? VehicleVerificationStatus.VERIFIED
        : VehicleVerificationStatus.PENDING_VERIFICATION;

    // 6. Create and persist entity
    const vehicle = this.vehicleRepository.create({
      registrationNumber: regNumber,
      propulsionType: PropulsionType.BATTERY_ELECTRIC,
      vehicleCategory: dto.vehicleCategory,
      make: dto.make,
      model: dto.model,
      yearOfManufacture: dto.yearOfManufacture,
      approvedPassengerSeating: dto.approvedPassengerSeating,
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
      city: dto.city ? dto.city.toLowerCase().trim() : 'visakhapatnam',
      isActive: true,
    });

    const saved = await this.vehicleRepository.save(vehicle);

    // 7. Authoritative audit trail
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

    // 3. Category & seating check
    const targetCategory = (dto.vehicleCategory ?? vehicle.vehicleCategory) as VehicleCategory;
    const targetSeating = dto.approvedPassengerSeating ?? vehicle.approvedPassengerSeating;
    const maxSeating = VehiclesService.MAX_SEATING_BY_CATEGORY[targetCategory] ?? 4;
    if (targetSeating > maxSeating) {
      throw new BadRequestException(
        `Approved passenger seating of ${targetSeating} exceeds the maximum allowed limit of ${maxSeating} for category '${targetCategory}'`,
      );
    }

    const previousState = {
      make: vehicle.make,
      model: vehicle.model,
      vehicleCategory: vehicle.vehicleCategory,
      currentSocPercent: vehicle.currentSocPercent,
      isActive: vehicle.isActive,
      verificationStatus: vehicle.verificationStatus,
    };

    // 4. Apply updates
    if (dto.vehicleCategory) vehicle.vehicleCategory = dto.vehicleCategory;
    if (dto.make) vehicle.make = dto.make;
    if (dto.model) vehicle.model = dto.model;
    if (dto.yearOfManufacture) vehicle.yearOfManufacture = dto.yearOfManufacture;
    if (dto.approvedPassengerSeating !== undefined)
      vehicle.approvedPassengerSeating = dto.approvedPassengerSeating;
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
    if (dto.city) vehicle.city = dto.city.toLowerCase().trim();
    if (dto.isActive !== undefined) vehicle.isActive = dto.isActive;

    // Green plate and owner reassignment require admin privileges
    if (dto.greenPlateVerified !== undefined && this.hasAdminOrFleetPrivileges(actor)) {
      vehicle.greenPlateVerified = dto.greenPlateVerified;
    }
    if (dto.ownerId !== undefined && this.hasAdminOrFleetPrivileges(actor)) {
      vehicle.ownerId = dto.ownerId;
    }

    const saved = await this.vehicleRepository.save(vehicle);

    // 5. Audit log
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
        currentSocPercent: saved.currentSocPercent,
        isActive: saved.isActive,
      },
    });

    return this.mapToDto(saved);
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
      make: v.make,
      model: v.model,
      yearOfManufacture: Number(v.yearOfManufacture),
      approvedPassengerSeating: Number(v.approvedPassengerSeating),
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
