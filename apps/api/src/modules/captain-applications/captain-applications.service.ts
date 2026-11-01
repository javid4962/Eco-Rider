import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptainApplication } from '../../database/entities/captain-application.entity';
import { CaptainApplicationReview } from '../../database/entities/captain-application-review.entity';
import { User } from '../../database/entities/user.entity';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { Document } from '../../database/entities/document.entity';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import {
  UpdateCaptainApplicationDraftDto,
  SubmitCaptainApplicationDto,
  ReviewCaptainApplicationDto,
  CaptainApplicationsQueryDto,
} from './dto';
import {
  CaptainApplicationStatus,
  RequirementStatus,
  VehicleOwnershipType,
  VehicleCategory,
  PropulsionType,
  DISALLOWED_PROPULSION_TYPES,
  CaptainApplicationDto,
  CaptainApplicationReviewDto,
  PaginatedCaptainApplicationsDto,
  PlatformRole,
} from '@ecoride/contracts';
import { CurrentActorPayload } from '../identity/current-actor.decorator';

@Injectable()
export class CaptainApplicationsService {
  private readonly logger = new Logger(CaptainApplicationsService.name);

  constructor(
    @InjectRepository(CaptainApplication)
    private readonly applicationRepository: Repository<CaptainApplication>,
    @InjectRepository(CaptainApplicationReview)
    private readonly reviewRepository: Repository<CaptainApplicationReview>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  /**
   * Authoritative server-side propulsion check.
   * Rejects PETROL, DIESEL, CNG, HYBRID, etc.
   */
  public assertElectricPropulsion(propulsionType?: string): void {
    if (!propulsionType) {
      return;
    }
    const normalized = propulsionType.toUpperCase().trim();
    const isDisallowed = DISALLOWED_PROPULSION_TYPES.some((d) => d === normalized);
    if (isDisallowed || normalized !== PropulsionType.BATTERY_ELECTRIC) {
      this.logger.warn(
        `Non-electric vehicle propulsion rejected in captain application: '${propulsionType}'`,
      );
      throw new BadRequestException(
        `Non-electric propulsion '${propulsionType}' is strictly prohibited. EcoRide is an EV-only electric mobility platform in Andhra Pradesh and accepts only '${PropulsionType.BATTERY_ELECTRIC}' vehicles.`,
      );
    }
  }

  /**
   * Retrieves the current captain's application, or creates a blank DRAFT if none exists.
   * Draft data persists in the database.
   */
  async getOrCreateDraft(actor: CurrentActorPayload): Promise<CaptainApplicationDto> {
    let app = await this.applicationRepository.findOne({
      where: { userId: actor.id },
      relations: ['reviews', 'reviews.reviewer'],
    });

    if (!app) {
      app = this.applicationRepository.create({
        userId: actor.id,
        status: CaptainApplicationStatus.DRAFT,
        driverRequirementsStatus: RequirementStatus.PENDING,
        vehicleRequirementsStatus: RequirementStatus.PENDING,
        vehicleOwnershipType: VehicleOwnershipType.OWNED,
        vehicleCategory: VehicleCategory.CITY_COMMUTE_2W,
        propulsionType: PropulsionType.BATTERY_ELECTRIC,
        city: 'visakhapatnam',
        submissionCount: 0,
      });
      app = await this.applicationRepository.save(app);
      app.reviews = [];

      await this.recordAuditEvent({
        actorId: actor.id,
        targetUserId: actor.id,
        action: 'CAPTAIN_APPLICATION_DRAFT_INITIALIZED',
        entityType: 'CAPTAIN_APPLICATION',
        entityId: app.id,
        status: 'SUCCESS',
      });
    }

    return this.mapToDto(app);
  }

  /**
   * Updates an existing application draft.
   * Allows saving incremental progress.
   * Rejects editing if the application is currently SUBMITTED or UNDER_REVIEW.
   * Explicitly allows editing when REJECTED (without creating duplicate records).
   */
  async updateDraft(
    actor: CurrentActorPayload,
    dto: UpdateCaptainApplicationDraftDto,
  ): Promise<CaptainApplicationDto> {
    let app = await this.applicationRepository.findOne({
      where: { userId: actor.id },
      relations: ['reviews', 'reviews.reviewer'],
    });

    if (!app) {
      app = this.applicationRepository.create({
        userId: actor.id,
        status: CaptainApplicationStatus.DRAFT,
        driverRequirementsStatus: RequirementStatus.PENDING,
        vehicleRequirementsStatus: RequirementStatus.PENDING,
        submissionCount: 0,
      });
    }

    // Lock modification while under review
    if (
      app.status === CaptainApplicationStatus.SUBMITTED ||
      app.status === CaptainApplicationStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Cannot modify an application currently under review. Please wait for the operations team review outcome.',
      );
    }

    // Verify electric propulsion if provided
    if (dto.propulsionType) {
      this.assertElectricPropulsion(dto.propulsionType);
    }

    // Validate referenced document ownership
    await this.validateReferencedDocuments(actor.id, dto);

    // Apply driver fields
    if (dto.fullName !== undefined) app.fullName = dto.fullName;
    if (dto.dateOfBirth !== undefined)
      app.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) : null;
    if (dto.drivingLicenseNumber !== undefined)
      app.drivingLicenseNumber = dto.drivingLicenseNumber.toUpperCase().trim();
    if (dto.drivingLicenseExpiry !== undefined)
      app.drivingLicenseExpiry = dto.drivingLicenseExpiry
        ? new Date(dto.drivingLicenseExpiry)
        : null;
    if (dto.badgeNumber !== undefined) app.badgeNumber = dto.badgeNumber;
    if (dto.emergencyContactName !== undefined) app.emergencyContactName = dto.emergencyContactName;
    if (dto.emergencyContactPhone !== undefined)
      app.emergencyContactPhone = dto.emergencyContactPhone;
    if (dto.drivingLicenseDocId !== undefined) app.drivingLicenseDocId = dto.drivingLicenseDocId;
    if (dto.aadhaarDocId !== undefined) app.aadhaarDocId = dto.aadhaarDocId;
    if (dto.panDocId !== undefined) app.panDocId = dto.panDocId;
    if (dto.policeVerificationDocId !== undefined)
      app.policeVerificationDocId = dto.policeVerificationDocId;
    if (dto.profilePhotoDocId !== undefined) app.profilePhotoDocId = dto.profilePhotoDocId;

    // Apply vehicle fields
    if (dto.vehicleOwnershipType !== undefined) app.vehicleOwnershipType = dto.vehicleOwnershipType;
    if (dto.vehicleCategory !== undefined) app.vehicleCategory = dto.vehicleCategory;
    if (dto.vehicleMake !== undefined) app.vehicleMake = dto.vehicleMake;
    if (dto.vehicleModel !== undefined) app.vehicleModel = dto.vehicleModel;
    if (dto.vehicleYear !== undefined) app.vehicleYear = dto.vehicleYear;
    if (dto.vehicleRegistrationNumber !== undefined)
      app.vehicleRegistrationNumber = dto.vehicleRegistrationNumber.toUpperCase().trim();
    if (dto.batteryCapacityKwh !== undefined) app.batteryCapacityKwh = dto.batteryCapacityKwh;
    if (dto.vehicleRcDocId !== undefined) app.vehicleRcDocId = dto.vehicleRcDocId;
    if (dto.greenPlatePermitDocId !== undefined)
      app.greenPlatePermitDocId = dto.greenPlatePermitDocId;
    if (dto.insuranceDocId !== undefined) app.insuranceDocId = dto.insuranceDocId;
    if (dto.fitnessDocId !== undefined) app.fitnessDocId = dto.fitnessDocId;
    if (dto.city !== undefined) app.city = dto.city.toLowerCase().trim();

    const saved = await this.applicationRepository.save(app);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: actor.id,
      action: 'CAPTAIN_APPLICATION_DRAFT_SAVED',
      entityType: 'CAPTAIN_APPLICATION',
      entityId: saved.id,
      status: 'SUCCESS',
      newState: { status: saved.status, fullName: saved.fullName, city: saved.city },
    });

    return this.mapToDto(saved);
  }

  /**
   * Submits or resubmits the application for operational review.
   * Executes strict validation on all mandatory driver and vehicle fields.
   * If the application was previously REJECTED, updates the same record
   * (without creating duplicates) and increments the submission count.
   */
  async submitApplication(
    actor: CurrentActorPayload,
    dto?: SubmitCaptainApplicationDto,
  ): Promise<CaptainApplicationDto> {
    const app = await this.applicationRepository.findOne({
      where: { userId: actor.id },
      relations: ['reviews', 'reviews.reviewer'],
    });

    if (!app) {
      throw new NotFoundException(
        'No application draft found for your account. Please initialize your draft before submitting.',
      );
    }

    if (
      app.status === CaptainApplicationStatus.SUBMITTED ||
      app.status === CaptainApplicationStatus.UNDER_REVIEW
    ) {
      throw new BadRequestException(
        'Your application has already been submitted and is currently undergoing verification.',
      );
    }

    if (app.status === CaptainApplicationStatus.APPROVED) {
      throw new BadRequestException(
        'Your captain application has already been verified and approved.',
      );
    }

    // 1. Strict Validation on Submission
    const errors: string[] = [];

    // Driver validation
    if (!app.fullName || app.fullName.trim().length === 0) {
      errors.push('Full legal name is required');
    }
    if (!app.drivingLicenseNumber || app.drivingLicenseNumber.trim().length === 0) {
      errors.push('Driving license number is required');
    }
    if (!app.drivingLicenseDocId) {
      errors.push('Commercial driving license document must be uploaded');
    }
    if (!app.aadhaarDocId && !app.panDocId) {
      errors.push('Government identity proof (Aadhaar or PAN) must be uploaded');
    }
    if (!app.emergencyContactName || !app.emergencyContactPhone) {
      errors.push('Emergency contact details are required');
    }

    // Vehicle validation
    this.assertElectricPropulsion(app.propulsionType);

    if (app.vehicleOwnershipType === VehicleOwnershipType.OWNED) {
      if (!app.vehicleRegistrationNumber || app.vehicleRegistrationNumber.trim().length === 0) {
        errors.push('Vehicle registration number is required for owned vehicles');
      }
      if (!app.vehicleMake || !app.vehicleModel) {
        errors.push('Electric vehicle make and model are required');
      }
      if (!app.vehicleRcDocId) {
        errors.push('Vehicle RC document must be uploaded');
      }
      if (!app.greenPlatePermitDocId) {
        errors.push('AP Green-Plate Commercial Permit must be uploaded');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Application submission failed: missing required verification details',
        errors,
      });
    }

    const isResubmission = app.status === CaptainApplicationStatus.REJECTED;
    const previousStatus = app.status;

    // Transition state
    app.status = CaptainApplicationStatus.SUBMITTED;
    app.driverRequirementsStatus = RequirementStatus.PENDING;
    app.vehicleRequirementsStatus = RequirementStatus.PENDING;
    app.submissionCount += 1;
    app.submittedAt = new Date();
    app.overallRejectionReason = null;

    const saved = await this.applicationRepository.save(app);

    // Create review history entry
    const reviewEntry = this.reviewRepository.create({
      applicationId: saved.id,
      reviewerId: null,
      previousStatus,
      newStatus: CaptainApplicationStatus.SUBMITTED,
      driverRequirementsStatus: RequirementStatus.PENDING,
      vehicleRequirementsStatus: RequirementStatus.PENDING,
      notes:
        dto?.notes ??
        (isResubmission
          ? 'Application resubmitted by captain after addressing verification feedback'
          : 'Initial captain application submitted for operational verification'),
    });
    await this.reviewRepository.save(reviewEntry);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: actor.id,
      action: isResubmission ? 'CAPTAIN_APPLICATION_RESUBMITTED' : 'CAPTAIN_APPLICATION_SUBMITTED',
      entityType: 'CAPTAIN_APPLICATION',
      entityId: saved.id,
      status: 'SUCCESS',
      newState: {
        status: saved.status,
        submissionCount: saved.submissionCount,
        submittedAt: saved.submittedAt,
      },
    });

    // Re-query with reviews
    const fullApp = await this.applicationRepository.findOne({
      where: { id: saved.id },
      relations: ['reviews', 'reviews.reviewer'],
    });

    return this.mapToDto(fullApp!);
  }

  /**
   * Retrieves review history for an application.
   * Captains can inspect history for their own application; admins can inspect any.
   */
  async getApplicationReviewHistory(
    actor: CurrentActorPayload,
    applicationId?: string,
  ): Promise<CaptainApplicationReviewDto[]> {
    let targetAppId = applicationId;

    if (!targetAppId) {
      const app = await this.applicationRepository.findOne({ where: { userId: actor.id } });
      if (!app) {
        return [];
      }
      targetAppId = app.id;
    } else {
      const app = await this.applicationRepository.findOne({ where: { id: targetAppId } });
      if (!app) {
        throw new NotFoundException(`Captain application with ID '${targetAppId}' not found`);
      }
      if (app.userId !== actor.id && !this.hasAdminPrivileges(actor)) {
        throw new ForbiddenException(
          'Access denied: You do not have permission to view review history for this application',
        );
      }
    }

    const reviews = await this.reviewRepository.find({
      where: { applicationId: targetAppId },
      relations: ['reviewer'],
      order: { reviewedAt: 'DESC' },
    });

    return reviews.map((r) => this.mapReviewToDto(r));
  }

  /**
   * Operations / Admin endpoint to list all applications with filtering and pagination.
   */
  async listApplications(
    actor: CurrentActorPayload,
    query: CaptainApplicationsQueryDto,
  ): Promise<PaginatedCaptainApplicationsDto> {
    if (!this.hasAdminPrivileges(actor)) {
      throw new ForbiddenException(
        'Access denied: Only platform operators and administrators can list captain applications',
      );
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const qb = this.applicationRepository
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.user', 'user')
      .leftJoinAndSelect('app.reviews', 'review')
      .leftJoinAndSelect('review.reviewer', 'reviewer');

    if (query.status) {
      qb.andWhere('app.status = :status', { status: query.status });
    }
    if (query.city) {
      qb.andWhere('LOWER(app.city) = LOWER(:city)', { city: query.city });
    }
    if (query.userId) {
      qb.andWhere('app.userId = :userId', { userId: query.userId });
    }

    qb.orderBy('app.updatedAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((app) => this.mapToDto(app)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves full details of a single captain application.
   * Accessible by the applicant captain or platform operators.
   */
  async getApplicationById(actor: CurrentActorPayload, id: string): Promise<CaptainApplicationDto> {
    const app = await this.applicationRepository.findOne({
      where: { id },
      relations: ['user', 'reviews', 'reviews.reviewer'],
    });

    if (!app) {
      throw new NotFoundException(`Captain application with ID '${id}' not found`);
    }

    if (app.userId !== actor.id && !this.hasAdminPrivileges(actor)) {
      throw new ForbiddenException(
        'Cross-account access denied: You cannot view another captain’s application',
      );
    }

    return this.mapToDto(app);
  }

  /**
   * Admin / Operator review endpoint supporting independent driver and vehicle requirements.
   * If both are APPROVED, automatically promotes user to CAPTAIN and registers/links verified vehicle.
   * If REJECTED, records specific feedback and enables captain to edit and resubmit without duplicate records.
   */
  async reviewApplication(
    actor: CurrentActorPayload,
    id: string,
    dto: ReviewCaptainApplicationDto,
  ): Promise<CaptainApplicationDto> {
    if (!this.hasAdminPrivileges(actor)) {
      throw new ForbiddenException(
        'Access denied: Only platform operators and fleet administrators can review applications',
      );
    }

    const app = await this.applicationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!app) {
      throw new NotFoundException(`Captain application with ID '${id}' not found`);
    }

    // Consistency check on approval: cannot approve overall application if requirements are not approved
    if (dto.overallStatus === CaptainApplicationStatus.APPROVED) {
      if (
        dto.driverRequirementsStatus !== RequirementStatus.APPROVED ||
        dto.vehicleRequirementsStatus !== RequirementStatus.APPROVED
      ) {
        throw new BadRequestException(
          'Cannot approve application: both driver and vehicle requirements must be APPROVED',
        );
      }
    }

    const previousStatus = app.status;
    app.status = dto.overallStatus;
    app.driverRequirementsStatus = dto.driverRequirementsStatus;
    app.driverRejectionReason = dto.driverRejectionReason ?? null;
    app.vehicleRequirementsStatus = dto.vehicleRequirementsStatus;
    app.vehicleRejectionReason = dto.vehicleRejectionReason ?? null;
    app.reviewedAt = new Date();
    app.lastReviewerId = actor.id;

    if (dto.overallStatus === CaptainApplicationStatus.REJECTED) {
      app.overallRejectionReason =
        dto.notes ??
        dto.driverRejectionReason ??
        dto.vehicleRejectionReason ??
        'Application rejected by operations review';
    } else if (dto.overallStatus === CaptainApplicationStatus.APPROVED) {
      app.overallRejectionReason = null;
    }

    // Save review audit trail
    const reviewEntry = this.reviewRepository.create({
      applicationId: app.id,
      reviewerId: actor.id,
      previousStatus,
      newStatus: dto.overallStatus,
      driverRequirementsStatus: dto.driverRequirementsStatus,
      driverRejectionReason: dto.driverRejectionReason ?? null,
      vehicleRequirementsStatus: dto.vehicleRequirementsStatus,
      vehicleRejectionReason: dto.vehicleRejectionReason ?? null,
      notes: dto.notes ?? null,
    });
    await this.reviewRepository.save(reviewEntry);

    // On approval: promote role and activate verified driver profile & vehicle
    if (dto.overallStatus === CaptainApplicationStatus.APPROVED) {
      await this.activateCaptainProfileAndVehicle(app);
    }

    const saved = await this.applicationRepository.save(app);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId: app.userId,
      action: 'CAPTAIN_APPLICATION_REVIEWED',
      entityType: 'CAPTAIN_APPLICATION',
      entityId: saved.id,
      status: 'SUCCESS',
      previousState: { status: previousStatus },
      newState: {
        status: saved.status,
        driverRequirementsStatus: saved.driverRequirementsStatus,
        vehicleRequirementsStatus: saved.vehicleRequirementsStatus,
      },
    });

    const fullApp = await this.applicationRepository.findOne({
      where: { id: saved.id },
      relations: ['reviews', 'reviews.reviewer'],
    });

    return this.mapToDto(fullApp!);
  }

  // ---------------------------------------------------------------------------
  // Helper & Activation Methods
  // ---------------------------------------------------------------------------

  private async activateCaptainProfileAndVehicle(app: CaptainApplication): Promise<void> {
    // 1. Promote User Role to CAPTAIN
    const user = await this.userRepository.findOne({ where: { id: app.userId } });
    if (user && user.role !== PlatformRole.CAPTAIN) {
      user.role = PlatformRole.CAPTAIN;
      await this.userRepository.save(user);
    }

    // 2. Create or Update DriverProfile
    let driverProfile = await this.driverProfileRepository.findOne({
      where: { userId: app.userId },
    });

    if (!driverProfile) {
      driverProfile = this.driverProfileRepository.create({
        userId: app.userId,
        licenseNumber: app.drivingLicenseNumber || 'AP31-TEMP-001',
        badgeNumber: app.badgeNumber ?? undefined,
        verificationStatus: 'VERIFIED',
        greenPlatePermitVerified: true,
        safetyTrainingCompleted: true,
        city: app.city,
      });
    } else {
      driverProfile.verificationStatus = 'VERIFIED';
      driverProfile.greenPlatePermitVerified = true;
      if (app.drivingLicenseNumber) driverProfile.licenseNumber = app.drivingLicenseNumber;
      if (app.badgeNumber) driverProfile.badgeNumber = app.badgeNumber;
      driverProfile.city = app.city;
    }

    // 3. Register or Link Verified EV Vehicle (if owned)
    if (app.vehicleOwnershipType === VehicleOwnershipType.OWNED && app.vehicleRegistrationNumber) {
      let vehicle = await this.vehicleRepository.findOne({
        where: { registrationNumber: app.vehicleRegistrationNumber },
      });

      if (!vehicle) {
        vehicle = this.vehicleRepository.create({
          registrationNumber: app.vehicleRegistrationNumber,
          propulsionType: PropulsionType.BATTERY_ELECTRIC,
          vehicleCategory: app.vehicleCategory,
          make: app.vehicleMake || 'Ather Energy',
          model: app.vehicleModel || '450X',
          yearOfManufacture: app.vehicleYear || 2024,
          approvedPassengerSeating: app.vehicleCategory === VehicleCategory.AUTO_COMMUTE_3W ? 3 : 1,
          batteryCapacityKwh: app.batteryCapacityKwh || 3.7,
          currentSocPercent: 100.0,
          ratedRangeKm: 110,
          ownerId: app.userId,
          greenPlateVerified: true,
          verificationStatus: 'VERIFIED',
          city: app.city,
          isActive: true,
        });
        vehicle = await this.vehicleRepository.save(vehicle);
      }

      driverProfile.assignedVehicleId = vehicle.id;
      app.createdVehicleId = vehicle.id;
    }

    await this.driverProfileRepository.save(driverProfile);
  }

  private async validateReferencedDocuments(
    applicantId: string,
    dto: UpdateCaptainApplicationDraftDto,
  ): Promise<void> {
    const docIds = [
      dto.drivingLicenseDocId,
      dto.aadhaarDocId,
      dto.panDocId,
      dto.policeVerificationDocId,
      dto.profilePhotoDocId,
      dto.vehicleRcDocId,
      dto.greenPlatePermitDocId,
      dto.insuranceDocId,
      dto.fitnessDocId,
    ].filter((id): id is string => Boolean(id));

    for (const docId of docIds) {
      const doc = await this.documentRepository.findOne({ where: { id: docId } });
      if (!doc) {
        throw new NotFoundException(`Referenced KYC document '${docId}' was not found`);
      }
      if (doc.userId !== applicantId) {
        throw new ForbiddenException(
          `Security violation: Document '${docId}' does not belong to your account`,
        );
      }
    }
  }

  private hasAdminPrivileges(actor: CurrentActorPayload): boolean {
    const adminRoles = [
      PlatformRole.SUPER_ADMIN,
      PlatformRole.OPERATOR,
      PlatformRole.FLEET,
      PlatformRole.FLEET_OWNER,
      PlatformRole.SAFETY_OFFICER,
    ];
    return (
      adminRoles.includes(actor.role as PlatformRole) ||
      actor.scopes.includes('*') ||
      actor.scopes.includes('captain:review') ||
      actor.scopes.includes('fleet:manage')
    );
  }

  private mapToDto(app: CaptainApplication): CaptainApplicationDto {
    const reviewHistory = app.reviews
      ? app.reviews
          .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime())
          .map((r) => this.mapReviewToDto(r))
      : [];

    return {
      id: app.id,
      userId: app.userId,
      status: app.status as CaptainApplicationStatus,
      driverRequirementsStatus: app.driverRequirementsStatus as RequirementStatus,
      driverRejectionReason: app.driverRejectionReason,
      fullName: app.fullName,
      dateOfBirth: app.dateOfBirth ? new Date(app.dateOfBirth).toISOString().split('T')[0] : null,
      drivingLicenseNumber: app.drivingLicenseNumber,
      drivingLicenseExpiry: app.drivingLicenseExpiry
        ? app.drivingLicenseExpiry.toISOString()
        : null,
      badgeNumber: app.badgeNumber,
      emergencyContactName: app.emergencyContactName,
      emergencyContactPhone: app.emergencyContactPhone,
      drivingLicenseDocId: app.drivingLicenseDocId,
      aadhaarDocId: app.aadhaarDocId,
      panDocId: app.panDocId,
      policeVerificationDocId: app.policeVerificationDocId,
      profilePhotoDocId: app.profilePhotoDocId,
      vehicleRequirementsStatus: app.vehicleRequirementsStatus as RequirementStatus,
      vehicleRejectionReason: app.vehicleRejectionReason,
      vehicleOwnershipType: app.vehicleOwnershipType as VehicleOwnershipType,
      vehicleCategory: app.vehicleCategory as VehicleCategory,
      propulsionType: app.propulsionType,
      vehicleMake: app.vehicleMake,
      vehicleModel: app.vehicleModel,
      vehicleYear: app.vehicleYear ? Number(app.vehicleYear) : null,
      vehicleRegistrationNumber: app.vehicleRegistrationNumber,
      batteryCapacityKwh: app.batteryCapacityKwh ? Number(app.batteryCapacityKwh) : null,
      vehicleRcDocId: app.vehicleRcDocId,
      greenPlatePermitDocId: app.greenPlatePermitDocId,
      insuranceDocId: app.insuranceDocId,
      fitnessDocId: app.fitnessDocId,
      createdVehicleId: app.createdVehicleId,
      city: app.city,
      submissionCount: Number(app.submissionCount),
      submittedAt: app.submittedAt ? app.submittedAt.toISOString() : null,
      reviewedAt: app.reviewedAt ? app.reviewedAt.toISOString() : null,
      lastReviewerId: app.lastReviewerId,
      overallRejectionReason: app.overallRejectionReason,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      reviewHistory,
    };
  }

  private mapReviewToDto(review: CaptainApplicationReview): CaptainApplicationReviewDto {
    return {
      id: review.id,
      applicationId: review.applicationId,
      reviewerId: review.reviewerId,
      reviewerName: review.reviewer?.name || null,
      previousStatus: review.previousStatus as CaptainApplicationStatus,
      newStatus: review.newStatus as CaptainApplicationStatus,
      driverRequirementsStatus: review.driverRequirementsStatus as RequirementStatus,
      driverRejectionReason: review.driverRejectionReason,
      vehicleRequirementsStatus: review.vehicleRequirementsStatus as RequirementStatus,
      vehicleRejectionReason: review.vehicleRejectionReason,
      notes: review.notes,
      reviewedAt: review.reviewedAt.toISOString(),
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
      this.logger.warn(`Failed to record captain application audit event: ${err}`);
    }
  }
}
