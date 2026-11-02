import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile, CaptainApplication } from '../../database/entities';
import {
  DriverComplianceStatus,
  DutyStatus,
  CaptainEligibilityDto,
  CaptainApprovalDetails,
  CaptainDocumentValidity,
  CaptainZonePermission,
  ToggleDutyResponse,
  PropulsionType,
  VehicleVerificationStatus,
  CaptainApplicationStatus,
  VehicleCategory,
  CATEGORY_SEATING_LIMITS,
  CITY_PERMITTED_CATEGORIES,
} from '@ecoride/contracts';
import { IdentityService } from '../identity/identity.service';
import { ReleaseBoundariesService } from '../release-boundaries/release-boundaries.service';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import { ToggleDutyDto, UpdateComplianceStatusDto } from './dto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(CaptainApplication)
    private readonly captainApplicationRepository: Repository<CaptainApplication>,
    private readonly identityService: IdentityService,
    private readonly releaseBoundariesService: ReleaseBoundariesService,
  ) {}

  /**
   * Calculates multi-dimensional assignment eligibility for an EV captain.
   * Separates draft completeness from compliance lifecycle states.
   */
  async calculateEligibility(userId: string): Promise<CaptainEligibilityDto> {
    const driverProfile = await this.driverProfileRepository.findOne({
      where: { userId },
      relations: ['assignedVehicle', 'user'],
    });

    const captainApp = await this.captainApplicationRepository.findOne({
      where: { userId },
    });

    const evaluatedAt = new Date().toISOString();
    const ineligibilityReasons: string[] = [];

    // 1. Evaluate Draft Completeness separately from Compliance Lifecycle State
    let isDraftComplete = false;
    if (captainApp) {
      const hasMandatoryDriverFields = Boolean(
        captainApp.fullName &&
        captainApp.drivingLicenseNumber &&
        captainApp.drivingLicenseDocId &&
        captainApp.aadhaarDocId,
      );
      const hasMandatoryVehicleFields = Boolean(
        captainApp.vehicleRegistrationNumber &&
        captainApp.vehicleRcDocId &&
        captainApp.greenPlatePermitDocId &&
        captainApp.propulsionType === PropulsionType.BATTERY_ELECTRIC,
      );
      isDraftComplete =
        (hasMandatoryDriverFields && hasMandatoryVehicleFields) ||
        captainApp.status === CaptainApplicationStatus.SUBMITTED ||
        captainApp.status === CaptainApplicationStatus.UNDER_REVIEW ||
        captainApp.status === CaptainApplicationStatus.APPROVED;
    } else if (driverProfile) {
      // Direct driver profile exists with license
      isDraftComplete = Boolean(driverProfile.licenseNumber);
    }

    if (!driverProfile) {
      return {
        captainId: '',
        userId,
        complianceStatus: DriverComplianceStatus.PENDING,
        isDraftComplete,
        isEligibleForAssignment: false,
        dutyStatus: DutyStatus.OFFLINE,
        dutyLastToggledAt: null,
        approvalDetails: {
          driverApproved: false,
          vehicleApproved: false,
          safetyTrainingCompleted: false,
          greenPlatePermitVerified: false,
        },
        documentValidity: {
          licenseValid: false,
          licenseNumber: '',
          licenseExpiryDate: null,
          vehicleAssigned: false,
          assignedVehicleId: null,
          vehicleRoadworthy: false,
          vehiclePropulsionValid: false,
          vehicleInsuranceValid: false,
          vehicleFitnessValid: false,
          vehiclePermitValid: false,
          batterySocAdequate: false,
          batterySocPercent: 0,
        },
        zonePermission: {
          city: 'visakhapatnam',
          zoneAllowed: false,
          serviceAllowed: false,
          reason: 'No driver profile initialized',
        },
        ineligibilityReasons: ['No driver profile found for user'],
        evaluatedAt,
      };
    }

    // 2. Evaluate Statutory Document Expiration
    const now = Date.now();
    let licenseExpired = false;
    let licenseDaysRemaining: number | null = null;

    if (driverProfile.licenseExpiryDate) {
      const expiryMs = new Date(driverProfile.licenseExpiryDate).getTime();
      licenseDaysRemaining = Math.ceil((expiryMs - now) / (1000 * 60 * 60 * 24));
      if (expiryMs < now) {
        licenseExpired = true;
      }
    }

    // Auto-detect expired state if previously verified but license expired
    let effectiveComplianceStatus = driverProfile.verificationStatus as DriverComplianceStatus;
    if (licenseExpired && effectiveComplianceStatus === DriverComplianceStatus.VERIFIED) {
      effectiveComplianceStatus = DriverComplianceStatus.EXPIRED;
    }

    // 3. Evaluate Assigned EV Vehicle & Roadworthiness
    const vehicle = driverProfile.assignedVehicle;
    let vehicleRoadworthy = false;
    let vehiclePropulsionValid = false;
    let vehicleInsuranceValid = false;
    let vehicleFitnessValid = false;
    let vehiclePermitValid = false;
    let batterySocAdequate = false;
    let batterySocPercent = 0;

    if (vehicle) {
      vehiclePropulsionValid = vehicle.propulsionType === PropulsionType.BATTERY_ELECTRIC;
      vehicleRoadworthy = vehicle.isRoadworthy;
      batterySocPercent = Number(vehicle.currentSocPercent) || 0;
      batterySocAdequate = batterySocPercent >= 15.0;

      if (vehicle.insuranceExpiryDate) {
        vehicleInsuranceValid = new Date(vehicle.insuranceExpiryDate).getTime() >= now;
      }
      if (vehicle.fitnessExpiryDate) {
        vehicleFitnessValid = new Date(vehicle.fitnessExpiryDate).getTime() >= now;
      }
      if (vehicle.commercialPermitExpiry) {
        vehiclePermitValid = new Date(vehicle.commercialPermitExpiry).getTime() >= now;
      }
    }

    // 4. Evaluate City / Zone Service Permissions
    const zoneEval = this.releaseBoundariesService.evaluate(
      driverProfile.city || 'visakhapatnam',
      'private_ev',
    );

    const zonePermission: CaptainZonePermission = {
      city: driverProfile.city || 'visakhapatnam',
      zoneAllowed: zoneEval.allowed,
      serviceAllowed: zoneEval.allowed,
      releasePhase: zoneEval.releasePhase,
      reason: zoneEval.reason || null,
    };

    // 5. Evaluate Ineligibility Reasons
    if (effectiveComplianceStatus === DriverComplianceStatus.SUSPENDED) {
      ineligibilityReasons.push(
        `Captain account is suspended: ${driverProfile.suspensionReason || 'Operational review in progress'}`,
      );
    } else if (effectiveComplianceStatus === DriverComplianceStatus.EXPIRED || licenseExpired) {
      ineligibilityReasons.push(
        'Driver driving license has expired. Please upload renewed transport license.',
      );
    } else if (effectiveComplianceStatus === DriverComplianceStatus.REJECTED) {
      ineligibilityReasons.push(
        'Captain compliance verification was rejected. Check compliance review notes.',
      );
    } else if (
      effectiveComplianceStatus === DriverComplianceStatus.PENDING ||
      effectiveComplianceStatus === DriverComplianceStatus.UNDER_REVIEW
    ) {
      ineligibilityReasons.push(
        `Captain compliance is pending approval (current status: ${effectiveComplianceStatus}).`,
      );
    }

    if (!isDraftComplete) {
      ineligibilityReasons.push('Onboarding application draft is incomplete.');
    }

    if (!driverProfile.safetyTrainingCompleted) {
      ineligibilityReasons.push('Mandatory EV safety training not completed.');
    }

    if (!driverProfile.greenPlatePermitVerified) {
      ineligibilityReasons.push('AP Green Plate commercial permit not verified.');
    }

    if (!vehicle) {
      ineligibilityReasons.push('No electric vehicle assigned to captain.');
    } else {
      // 1. Missing registration check
      if (!vehicle.registrationNumber || vehicle.registrationNumber.trim().length === 0) {
        ineligibilityReasons.push('Assigned vehicle has missing or invalid registration number.');
      }

      // 2. Over-capacity check
      const vehicleCat = (vehicle.vehicleCategory ||
        VehicleCategory.CITY_COMMUTE_2W) as VehicleCategory;
      const limits = CATEGORY_SEATING_LIMITS[vehicleCat];
      if (
        limits &&
        vehicle.approvedPassengerSeating &&
        vehicle.approvedPassengerSeating > limits.maxSeats
      ) {
        ineligibilityReasons.push(
          `Assigned vehicle is over-capacity: ${vehicle.approvedPassengerSeating} customer seats exceeds legal limit of ${limits.maxSeats} for category '${vehicleCat}'.`,
        );
      }

      // 3. Service class & city matching check
      const opCity = (driverProfile.city || vehicle.city || 'visakhapatnam').toLowerCase().trim();
      const permittedCats = CITY_PERMITTED_CATEGORIES[opCity] ?? [];
      if (!permittedCats.includes(vehicleCat)) {
        ineligibilityReasons.push(
          `Assigned vehicle service class '${vehicleCat}' is incompatible or unauthorized in operating city '${opCity}'.`,
        );
      }

      if (!vehiclePropulsionValid) {
        ineligibilityReasons.push('Assigned vehicle is not 100% battery electric.');
      }
      if (vehicle.verificationStatus !== VehicleVerificationStatus.VERIFIED) {
        ineligibilityReasons.push(
          `Assigned vehicle verification status is ${vehicle.verificationStatus}.`,
        );
      }
      if (!vehicleRoadworthy) {
        ineligibilityReasons.push(
          'Assigned vehicle is not roadworthy (insurance, fitness or commercial permit expired).',
        );
      }
      if (!batterySocAdequate) {
        ineligibilityReasons.push(
          `Vehicle battery SoC (${batterySocPercent}%) is below minimum safe threshold (15%).`,
        );
      }
    }

    if (!zonePermission.zoneAllowed) {
      ineligibilityReasons.push(
        `EV ride services in city '${driverProfile.city}' are disabled: ${zoneEval.reason || 'Phase inactive'}`,
      );
    }

    // 6. Assignment Eligibility: Captain MUST be VERIFIED, draft complete, and zero blockers
    const isEligibleForAssignment =
      effectiveComplianceStatus === DriverComplianceStatus.VERIFIED &&
      isDraftComplete &&
      ineligibilityReasons.length === 0;

    const approvalDetails: CaptainApprovalDetails = {
      driverApproved: effectiveComplianceStatus === DriverComplianceStatus.VERIFIED,
      vehicleApproved: Boolean(
        vehicle && vehicle.verificationStatus === VehicleVerificationStatus.VERIFIED,
      ),
      safetyTrainingCompleted: Boolean(driverProfile.safetyTrainingCompleted),
      greenPlatePermitVerified: Boolean(driverProfile.greenPlatePermitVerified),
      backgroundCheckCleared: true,
    };

    const documentValidity: CaptainDocumentValidity = {
      licenseValid: !licenseExpired && Boolean(driverProfile.licenseNumber),
      licenseNumber: driverProfile.licenseNumber,
      licenseExpiryDate: driverProfile.licenseExpiryDate
        ? driverProfile.licenseExpiryDate.toISOString()
        : null,
      licenseDaysRemaining,
      badgeNumber: driverProfile.badgeNumber || null,
      vehicleAssigned: Boolean(vehicle),
      assignedVehicleId: driverProfile.assignedVehicleId || null,
      vehicleRegistrationNumber: vehicle ? vehicle.registrationNumber : null,
      vehicleRoadworthy,
      vehiclePropulsionValid,
      vehicleInsuranceValid,
      vehicleFitnessValid,
      vehiclePermitValid,
      batterySocAdequate,
      batterySocPercent,
    };

    return {
      captainId: driverProfile.id,
      userId,
      complianceStatus: effectiveComplianceStatus,
      isDraftComplete,
      isEligibleForAssignment,
      dutyStatus: driverProfile.dutyStatus as DutyStatus,
      dutyLastToggledAt: driverProfile.dutyLastToggledAt
        ? driverProfile.dutyLastToggledAt.toISOString()
        : null,
      suspensionReason: driverProfile.suspensionReason || null,
      complianceNotes: driverProfile.complianceNotes || null,
      approvalDetails,
      documentValidity,
      zonePermission,
      ineligibilityReasons,
      evaluatedAt,
    };
  }

  /**
   * Toggles captain duty state between ONLINE and OFFLINE.
   * Enforces that suspended, expired, or non-verified captains CANNOT go online.
   */
  async toggleDuty(actor: CurrentActorPayload, dto: ToggleDutyDto): Promise<ToggleDutyResponse> {
    const driverProfile = await this.driverProfileRepository.findOne({
      where: { userId: actor.id },
      relations: ['assignedVehicle'],
    });

    if (!driverProfile) {
      throw new NotFoundException(`Driver profile not found for user ${actor.id}`);
    }

    if (dto.status === DutyStatus.ONLINE) {
      const eligibility = await this.calculateEligibility(actor.id);

      if (!eligibility.isEligibleForAssignment) {
        this.logger.warn(
          `Duty online request rejected for captain ${driverProfile.id} (user ${actor.id}): ${eligibility.ineligibilityReasons.join('; ')}`,
        );

        await this.identityService.recordAuditEvent({
          actorId: actor.id,
          targetUserId: actor.id,
          action: 'CAPTAIN_DUTY_TOGGLE_REJECTED',
          entityType: 'DRIVER_PROFILE',
          entityId: driverProfile.id,
          previousState: { dutyStatus: driverProfile.dutyStatus },
          newState: {
            requestedStatus: dto.status,
            complianceStatus: eligibility.complianceStatus,
            ineligibilityReasons: eligibility.ineligibilityReasons,
          },
          status: 'DENIED',
          ipAddress: actor.ipAddress,
          correlationId: actor.correlationId,
        });

        throw new UnprocessableEntityException({
          message: `Cannot go online: Captain does not satisfy compliance or assignment eligibility requirements (status: ${eligibility.complianceStatus}): ${eligibility.ineligibilityReasons.join('; ')}`,
          details: eligibility.ineligibilityReasons,
        });
      }

      driverProfile.dutyStatus = DutyStatus.ONLINE;
      driverProfile.dutyLastToggledAt = new Date();
      await this.driverProfileRepository.save(driverProfile);

      await this.identityService.recordAuditEvent({
        actorId: actor.id,
        targetUserId: actor.id,
        action: 'CAPTAIN_DUTY_ONLINE',
        entityType: 'DRIVER_PROFILE',
        entityId: driverProfile.id,
        previousState: { dutyStatus: DutyStatus.OFFLINE },
        newState: { dutyStatus: DutyStatus.ONLINE },
        status: 'SUCCESS',
        ipAddress: actor.ipAddress,
        correlationId: actor.correlationId,
      });

      return {
        dutyStatus: DutyStatus.ONLINE,
        eligible: true,
        captainId: driverProfile.id,
        userId: actor.id,
        assignedVehicleId: driverProfile.assignedVehicleId || null,
        city: driverProfile.city,
        lastToggledAt: driverProfile.dutyLastToggledAt.toISOString(),
        message: 'Captain duty is now ONLINE. Ready for EV ride assignments.',
      };
    }

    // Set OFFLINE
    const previousDuty = driverProfile.dutyStatus;
    driverProfile.dutyStatus = DutyStatus.OFFLINE;
    driverProfile.dutyLastToggledAt = new Date();
    await this.driverProfileRepository.save(driverProfile);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      targetUserId: actor.id,
      action: 'CAPTAIN_DUTY_OFFLINE',
      entityType: 'DRIVER_PROFILE',
      entityId: driverProfile.id,
      previousState: { dutyStatus: previousDuty },
      newState: { dutyStatus: DutyStatus.OFFLINE },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return {
      dutyStatus: DutyStatus.OFFLINE,
      eligible: false,
      captainId: driverProfile.id,
      userId: actor.id,
      assignedVehicleId: driverProfile.assignedVehicleId || null,
      city: driverProfile.city,
      lastToggledAt: driverProfile.dutyLastToggledAt.toISOString(),
      message: 'Captain duty is now OFFLINE. Dispatches paused.',
    };
  }

  /**
   * Administrative compliance status update (SUSPENDED, EXPIRED, VERIFIED, REJECTED, UNDER_REVIEW).
   * Restricts to operators, safety officers, or super admins.
   */
  async updateComplianceStatus(
    actor: CurrentActorPayload,
    targetUserId: string,
    dto: UpdateComplianceStatusDto,
  ): Promise<CaptainEligibilityDto> {
    await this.identityService.assertCanAccessUser(
      actor,
      targetUserId,
      'driver:write',
      'UPDATE_COMPLIANCE_STATUS',
    );

    const driverProfile = await this.driverProfileRepository.findOne({
      where: { userId: targetUserId },
      relations: ['assignedVehicle'],
    });

    if (!driverProfile) {
      throw new NotFoundException(`Driver profile not found for user ${targetUserId}`);
    }

    if (dto.status === DriverComplianceStatus.SUSPENDED && !dto.suspensionReason) {
      throw new BadRequestException('A suspension reason is mandatory when suspending a driver.');
    }

    const previousStatus = driverProfile.verificationStatus;
    const previousDuty = driverProfile.dutyStatus;

    driverProfile.verificationStatus = dto.status;
    if (dto.status === DriverComplianceStatus.SUSPENDED) {
      driverProfile.suspensionReason = dto.suspensionReason;
    } else if (dto.status === DriverComplianceStatus.VERIFIED) {
      driverProfile.suspensionReason = null;
    }

    if (dto.notes) {
      driverProfile.complianceNotes = dto.notes;
    }

    // Safety guard: If driver was ONLINE and is now suspended, expired or rejected, force OFFLINE
    if (
      dto.status !== DriverComplianceStatus.VERIFIED &&
      driverProfile.dutyStatus === DutyStatus.ONLINE
    ) {
      driverProfile.dutyStatus = DutyStatus.OFFLINE;
      driverProfile.dutyLastToggledAt = new Date();
      this.logger.warn(
        `Safety auto-offline: Driver ${driverProfile.id} compliance status changed to ${dto.status}. Forced OFFLINE.`,
      );
    }

    await this.driverProfileRepository.save(driverProfile);

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: 'CAPTAIN_COMPLIANCE_STATUS_CHANGED',
      entityType: 'DRIVER_PROFILE',
      entityId: driverProfile.id,
      previousState: {
        verificationStatus: previousStatus,
        dutyStatus: previousDuty,
      },
      newState: {
        verificationStatus: dto.status,
        dutyStatus: driverProfile.dutyStatus,
        suspensionReason: driverProfile.suspensionReason,
        notes: dto.notes,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    return this.calculateEligibility(targetUserId);
  }

  /**
   * Retrieves captain eligibility with ownership / role checks.
   */
  async getCaptainEligibility(
    actor: CurrentActorPayload,
    targetUserId: string,
  ): Promise<CaptainEligibilityDto> {
    await this.identityService.assertCanAccessUser(
      actor,
      targetUserId,
      'driver:read',
      'READ_COMPLIANCE_ELIGIBILITY',
    );

    return this.calculateEligibility(targetUserId);
  }
}
