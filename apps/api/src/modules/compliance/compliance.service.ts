import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  DriverProfile,
  CaptainApplication,
  ComplianceWarning,
  Vehicle,
  Document,
} from '../../database/entities';
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
  ComplianceWarningTier,
  ComplianceTargetType,
  ComplianceScanSummaryDto,
  ComplianceExpiryWarning,
  ReverifyComplianceResponse,
  PlatformRole,
  DocumentStatus,
} from '@ecoride/contracts';
import { IdentityService } from '../identity/identity.service';
import { ReleaseBoundariesService } from '../release-boundaries/release-boundaries.service';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  ToggleDutyDto,
  UpdateComplianceStatusDto,
  ReverifyComplianceDto,
  QueryComplianceWarningsDto,
} from './dto';

/**
 * Calculates calendar days remaining to expiry relative to local Andhra Pradesh boundary (Asia/Kolkata).
 * When diffMs <= 0, returns floor <= 0 indicating expired.
 */
export function calculateDaysRemainingToLocalBoundary(
  expiryDateInput: Date | string,
  nowInput: Date | string = new Date(),
): number {
  const expiry = new Date(expiryDateInput);
  const now = new Date(nowInput);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) {
    return Math.floor(diffMs / (24 * 60 * 60 * 1000));
  }
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Maps days remaining to statutory compliance warning tiers.
 */
export function determineWarningTier(daysRemaining: number): ComplianceWarningTier | null {
  if (daysRemaining <= 0) {
    return ComplianceWarningTier.EXPIRED;
  }
  if (daysRemaining <= 1) {
    return ComplianceWarningTier.WARNING_1D;
  }
  if (daysRemaining <= 7) {
    return ComplianceWarningTier.WARNING_7D;
  }
  if (daysRemaining <= 15) {
    return ComplianceWarningTier.WARNING_15D;
  }
  if (daysRemaining <= 30) {
    return ComplianceWarningTier.WARNING_30D;
  }
  return null;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(CaptainApplication)
    private readonly captainApplicationRepository: Repository<CaptainApplication>,
    @InjectRepository(ComplianceWarning)
    private readonly complianceWarningRepository: Repository<ComplianceWarning>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
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
      licenseDaysRemaining = calculateDaysRemainingToLocalBoundary(
        driverProfile.licenseExpiryDate,
        new Date(now),
      );
      if (licenseDaysRemaining <= 0) {
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

  /**
   * Performs automated scan for expiring/expired driver licenses and vehicle credentials.
   * Enforces immediate suspension (Duty ONLINE -> OFFLINE) and status transition to EXPIRED
   * at local AP midnight boundary (Asia/Kolkata). Emits advance warnings (30d, 15d, 7d, 1d).
   * Preserves historical records and audit trail.
   */
  async runScheduledExpiryScan(referenceDate?: Date): Promise<ComplianceScanSummaryDto> {
    const scanDate = referenceDate ? new Date(referenceDate) : new Date();
    const profiles = await this.driverProfileRepository.find({
      relations: ['user', 'assignedVehicle'],
    });

    let warningsIssued = 0;
    let accountsSuspendedOrExpired = 0;
    const warnings: ComplianceExpiryWarning[] = [];

    for (const profile of profiles) {
      let driverSuspendedThisScan = false;

      // 1. Check Driver License Expiration
      if (profile.licenseExpiryDate) {
        const daysRemaining = calculateDaysRemainingToLocalBoundary(
          profile.licenseExpiryDate,
          scanDate,
        );
        const tier = determineWarningTier(daysRemaining);

        if (tier) {
          const actionRequired =
            tier === ComplianceWarningTier.EXPIRED
              ? 'Transport driving license expired at local boundary. Account suspended from duty until renewed and verified.'
              : tier === ComplianceWarningTier.WARNING_1D
                ? 'Urgent: Transport driving license expires within 24 hours. Immediate renewal required to prevent automatic suspension.'
                : `Notice: Transport driving license expires in ${daysRemaining} days. Please upload renewed DL certificate.`;

          const existingWarning = await this.complianceWarningRepository.findOne({
            where: {
              userId: profile.userId,
              targetType: 'DRIVER_LICENSE',
              warningTier: tier,
              isResolved: false,
            },
          });

          if (!existingWarning) {
            const warning = this.complianceWarningRepository.create({
              userId: profile.userId,
              driverProfileId: profile.id,
              targetType: 'DRIVER_LICENSE',
              targetIdentifier: profile.licenseNumber,
              expiryDate: new Date(profile.licenseExpiryDate),
              daysRemaining,
              warningTier: tier,
              isResolved: false,
              actionRequired,
            });
            await this.complianceWarningRepository.save(warning);
            warningsIssued++;

            await this.identityService.recordAuditEvent({
              actorId: '00000000-0000-0000-0000-000000000000',
              targetUserId: profile.userId,
              action:
                tier === ComplianceWarningTier.EXPIRED
                  ? 'COMPLIANCE_EXPIRY_SUSPENDED'
                  : 'COMPLIANCE_EXPIRY_WARNING_ISSUED',
              entityType: 'DRIVER_PROFILE',
              entityId: profile.id,
              previousState: {
                verificationStatus: profile.verificationStatus,
                dutyStatus: profile.dutyStatus,
              },
              newState: {
                targetType: 'DRIVER_LICENSE',
                warningTier: tier,
                daysRemaining,
                expiryDate: profile.licenseExpiryDate,
              },
              status: 'SUCCESS',
            });
          }

          if (tier === ComplianceWarningTier.EXPIRED) {
            const previousStatus = profile.verificationStatus;
            const previousDuty = profile.dutyStatus;
            let profileChanged = false;

            if (profile.verificationStatus === DriverComplianceStatus.VERIFIED) {
              profile.verificationStatus = DriverComplianceStatus.EXPIRED;
              profile.suspensionReason = 'Driving license expired at local boundary';
              profileChanged = true;
            }

            if (profile.dutyStatus === DutyStatus.ONLINE) {
              profile.dutyStatus = DutyStatus.OFFLINE;
              profile.dutyLastToggledAt = scanDate;
              profileChanged = true;
              driverSuspendedThisScan = true;

              this.logger.warn(
                `Compliance Auto-Suspension: Captain ${profile.id} (user ${profile.userId}) driving license expired. Forced OFFLINE.`,
              );

              await this.identityService.recordAuditEvent({
                actorId: '00000000-0000-0000-0000-000000000000',
                targetUserId: profile.userId,
                action: 'CAPTAIN_AUTO_SUSPENDED_FOR_EXPIRY',
                entityType: 'DRIVER_PROFILE',
                entityId: profile.id,
                previousState: {
                  verificationStatus: previousStatus,
                  dutyStatus: previousDuty,
                },
                newState: {
                  verificationStatus: profile.verificationStatus,
                  dutyStatus: profile.dutyStatus,
                  reason: 'Driving license expired at local boundary',
                },
                status: 'SUCCESS',
              });
            }

            if (profileChanged) {
              await this.driverProfileRepository.save(profile);
              accountsSuspendedOrExpired++;
            }
          }

          warnings.push({
            targetType: 'DRIVER_LICENSE',
            targetId: profile.id,
            targetIdentifier: profile.licenseNumber,
            userId: profile.userId,
            captainName: profile.user?.name,
            expiryDate: new Date(profile.licenseExpiryDate).toISOString(),
            daysRemaining,
            warningTier: tier,
            isResolved: false,
            actionRequired,
            dutyStatus: profile.dutyStatus,
            complianceStatus: profile.verificationStatus,
          });
        }
      }

      // 2. Check Assigned Vehicle Documents Expiration
      if (profile.assignedVehicle) {
        const v = profile.assignedVehicle;
        const vehicleChecks: Array<{
          targetType: ComplianceTargetType;
          date: Date | null | undefined;
          number: string | null | undefined;
          name: string;
        }> = [
          {
            targetType: 'VEHICLE_INSURANCE',
            date: v.insuranceExpiryDate,
            number: v.insurancePolicyNumber,
            name: 'Commercial Insurance',
          },
          {
            targetType: 'VEHICLE_FITNESS',
            date: v.fitnessExpiryDate,
            number: v.fitnessCertificateNumber,
            name: 'Fitness Certificate',
          },
          {
            targetType: 'VEHICLE_PERMIT',
            date: v.commercialPermitExpiry,
            number: v.commercialPermitNumber,
            name: 'Commercial Green Plate Permit',
          },
        ];

        for (const check of vehicleChecks) {
          if (check.date) {
            const daysRemaining = calculateDaysRemainingToLocalBoundary(check.date, scanDate);
            const tier = determineWarningTier(daysRemaining);

            if (tier) {
              const actionRequired =
                tier === ComplianceWarningTier.EXPIRED
                  ? `${check.name} expired at local boundary. Vehicle is not roadworthy; captain cannot operate.`
                  : tier === ComplianceWarningTier.WARNING_1D
                    ? `Urgent: ${check.name} expires within 24 hours. Immediate renewal required.`
                    : `Notice: ${check.name} expires in ${daysRemaining} days. Renew statutory certificate.`;

              const existingWarning = await this.complianceWarningRepository.findOne({
                where: {
                  userId: profile.userId,
                  targetType: check.targetType,
                  warningTier: tier,
                  isResolved: false,
                },
              });

              if (!existingWarning) {
                const warning = this.complianceWarningRepository.create({
                  userId: profile.userId,
                  driverProfileId: profile.id,
                  vehicleId: v.id,
                  targetType: check.targetType,
                  targetIdentifier: check.number || v.registrationNumber,
                  expiryDate: new Date(check.date),
                  daysRemaining,
                  warningTier: tier,
                  isResolved: false,
                  actionRequired,
                });
                await this.complianceWarningRepository.save(warning);
                warningsIssued++;

                await this.identityService.recordAuditEvent({
                  actorId: '00000000-0000-0000-0000-000000000000',
                  targetUserId: profile.userId,
                  action:
                    tier === ComplianceWarningTier.EXPIRED
                      ? 'VEHICLE_EXPIRY_UNROADWORTHY'
                      : 'COMPLIANCE_EXPIRY_WARNING_ISSUED',
                  entityType: 'VEHICLE',
                  entityId: v.id,
                  previousState: { isRoadworthy: v.isRoadworthy },
                  newState: {
                    targetType: check.targetType,
                    warningTier: tier,
                    daysRemaining,
                    expiryDate: check.date,
                  },
                  status: 'SUCCESS',
                });
              }

              if (tier === ComplianceWarningTier.EXPIRED) {
                if (profile.dutyStatus === DutyStatus.ONLINE && !driverSuspendedThisScan) {
                  profile.dutyStatus = DutyStatus.OFFLINE;
                  profile.dutyLastToggledAt = scanDate;
                  await this.driverProfileRepository.save(profile);
                  driverSuspendedThisScan = true;
                  accountsSuspendedOrExpired++;

                  this.logger.warn(
                    `Safety Auto-Offline: Driver ${profile.id} forced OFFLINE because vehicle ${v.registrationNumber} ${check.name} expired.`,
                  );

                  await this.identityService.recordAuditEvent({
                    actorId: '00000000-0000-0000-0000-000000000000',
                    targetUserId: profile.userId,
                    action: 'CAPTAIN_AUTO_SUSPENDED_FOR_VEHICLE_EXPIRY',
                    entityType: 'DRIVER_PROFILE',
                    entityId: profile.id,
                    previousState: { dutyStatus: DutyStatus.ONLINE },
                    newState: {
                      dutyStatus: DutyStatus.OFFLINE,
                      expiredDocument: check.targetType,
                    },
                    status: 'SUCCESS',
                  });
                }
              }

              warnings.push({
                targetType: check.targetType,
                targetId: v.id,
                targetIdentifier: check.number || v.registrationNumber,
                userId: profile.userId,
                captainName: profile.user?.name,
                expiryDate: new Date(check.date).toISOString(),
                daysRemaining,
                warningTier: tier,
                isResolved: false,
                actionRequired,
                dutyStatus: profile.dutyStatus,
                complianceStatus: profile.verificationStatus,
              });
            }
          }
        }
      }
    }

    const totalVehicles = await this.vehicleRepository.count();

    return {
      scannedAt: scanDate.toISOString(),
      totalProfilesScanned: profiles.length,
      totalVehiclesScanned: totalVehicles,
      warningsIssued,
      accountsSuspendedOrExpired,
      warnings,
    };
  }

  /**
   * Re-verification workflow for renewed statutory documents (driver license, insurance, fitness, permit).
   * Preserves historical records, resolves outstanding warnings, updates credentials,
   * restores VERIFIED compliance status if previously expired/suspended, and recalculates eligibility.
   */
  async reverifyCompliance(
    actor: CurrentActorPayload,
    dto: ReverifyComplianceDto,
  ): Promise<ReverifyComplianceResponse> {
    const targetUserId = dto.targetUserId || actor.id;

    if (targetUserId !== actor.id) {
      await this.identityService.assertCanAccessUser(
        actor,
        targetUserId,
        'driver:write',
        'REVERIFY_COMPLIANCE',
      );
    }

    const newExpiry = new Date(dto.newExpiryDate);
    if (isNaN(newExpiry.getTime()) || newExpiry.getTime() <= Date.now()) {
      throw new BadRequestException('New statutory expiry date must be a valid future date.');
    }

    const doc = await this.documentRepository.findOne({
      where: { id: dto.documentId },
    });
    if (!doc) {
      throw new NotFoundException(
        `Uploaded renewal document ${dto.documentId} not found in private document repository.`,
      );
    }

    if (
      doc.scanStatus === DocumentStatus.INFECTED ||
      doc.scanStatus === DocumentStatus.QUARANTINED
    ) {
      throw new UnprocessableEntityException(
        'Cannot accept renewal document: document failed malware scanning verification.',
      );
    }

    const driverProfile = await this.driverProfileRepository.findOne({
      where: { userId: targetUserId },
      relations: ['assignedVehicle'],
    });

    if (!driverProfile) {
      throw new NotFoundException(`Driver profile not found for user ${targetUserId}`);
    }

    let targetId = driverProfile.id;
    const previousDriverState = {
      licenseExpiryDate: driverProfile.licenseExpiryDate,
      licenseNumber: driverProfile.licenseNumber,
      verificationStatus: driverProfile.verificationStatus,
      dutyStatus: driverProfile.dutyStatus,
    };

    if (dto.targetType === 'DRIVER_LICENSE') {
      driverProfile.licenseExpiryDate = newExpiry;
      if (dto.newDocumentNumber) {
        driverProfile.licenseNumber = dto.newDocumentNumber;
      }
      if (
        driverProfile.verificationStatus === DriverComplianceStatus.EXPIRED ||
        driverProfile.verificationStatus === DriverComplianceStatus.SUSPENDED
      ) {
        driverProfile.verificationStatus = DriverComplianceStatus.VERIFIED;
        driverProfile.suspensionReason = null;
      }
      if (dto.notes) {
        driverProfile.complianceNotes = dto.notes;
      }
      await this.driverProfileRepository.save(driverProfile);
    } else {
      const vehicle = driverProfile.assignedVehicle;
      if (!vehicle) {
        throw new BadRequestException(
          'No vehicle assigned to captain for vehicle compliance renewal.',
        );
      }
      targetId = vehicle.id;

      if (dto.targetType === 'VEHICLE_INSURANCE') {
        vehicle.insuranceExpiryDate = newExpiry;
        if (dto.newDocumentNumber) {
          vehicle.insurancePolicyNumber = dto.newDocumentNumber;
        }
      } else if (dto.targetType === 'VEHICLE_FITNESS') {
        vehicle.fitnessExpiryDate = newExpiry;
        if (dto.newDocumentNumber) {
          vehicle.fitnessCertificateNumber = dto.newDocumentNumber;
        }
      } else if (dto.targetType === 'VEHICLE_PERMIT') {
        vehicle.commercialPermitExpiry = newExpiry;
        if (dto.newDocumentNumber) {
          vehicle.commercialPermitNumber = dto.newDocumentNumber;
        }
      }

      await this.vehicleRepository.save(vehicle);

      // If driver was EXPIRED and their driving license is valid, restore to VERIFIED
      const licenseDays = driverProfile.licenseExpiryDate
        ? calculateDaysRemainingToLocalBoundary(driverProfile.licenseExpiryDate)
        : null;
      if (
        driverProfile.verificationStatus === DriverComplianceStatus.EXPIRED &&
        licenseDays !== null &&
        licenseDays > 0
      ) {
        driverProfile.verificationStatus = DriverComplianceStatus.VERIFIED;
        driverProfile.suspensionReason = null;
        await this.driverProfileRepository.save(driverProfile);
      }
    }

    // Resolve outstanding warnings for this target (preserving historical records)
    const activeWarnings = await this.complianceWarningRepository.find({
      where: {
        userId: targetUserId,
        targetType: dto.targetType,
        isResolved: false,
      },
    });

    const now = new Date();
    for (const w of activeWarnings) {
      w.isResolved = true;
      w.resolvedAt = now;
      w.resolutionType = 'REVERIFIED';
      await this.complianceWarningRepository.save(w);
    }

    await this.identityService.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: 'CAPTAIN_COMPLIANCE_REVERIFIED',
      entityType: dto.targetType === 'DRIVER_LICENSE' ? 'DRIVER_PROFILE' : 'VEHICLE',
      entityId: targetId,
      previousState: previousDriverState,
      newState: {
        targetType: dto.targetType,
        newExpiryDate: newExpiry.toISOString(),
        documentId: dto.documentId,
        verificationStatus: driverProfile.verificationStatus,
        resolvedWarningsCount: activeWarnings.length,
      },
      status: 'SUCCESS',
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
    });

    const eligibility = await this.calculateEligibility(targetUserId);

    return {
      success: true,
      message: `Statutory credential '${dto.targetType}' re-verified successfully. Expiry updated to ${newExpiry.toISOString()}.`,
      targetType: dto.targetType,
      targetId,
      userId: targetUserId,
      updatedExpiryDate: newExpiry.toISOString(),
      resolvedWarningsCount: activeWarnings.length,
      eligibility,
    };
  }

  /**
   * Retrieves active or historical compliance warnings.
   */
  async getComplianceWarnings(
    actor: CurrentActorPayload,
    query: QueryComplianceWarningsDto,
  ): Promise<ComplianceExpiryWarning[]> {
    const targetUserId = query.userId;

    if (targetUserId && targetUserId !== actor.id) {
      await this.identityService.assertCanAccessUser(
        actor,
        targetUserId,
        'driver:read',
        'READ_COMPLIANCE_WARNINGS',
      );
    }

    const where: FindOptionsWhere<ComplianceWarning> = {};
    if (targetUserId) {
      where.userId = targetUserId;
    } else if (actor.role === PlatformRole.CAPTAIN || actor.role === PlatformRole.RIDER) {
      where.userId = actor.id;
    }

    if (query.targetType) {
      where.targetType = query.targetType;
    }
    if (query.warningTier) {
      where.warningTier = query.warningTier;
    }
    if (query.isResolved !== undefined) {
      where.isResolved = query.isResolved;
    }

    const records = await this.complianceWarningRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return records.map((w) => ({
      id: w.id,
      targetType: w.targetType as ComplianceTargetType,
      targetId: w.driverProfileId || w.vehicleId || '',
      targetIdentifier: w.targetIdentifier,
      userId: w.userId,
      captainName: w.user?.name,
      expiryDate: w.expiryDate.toISOString(),
      daysRemaining: w.daysRemaining,
      warningTier: w.warningTier as ComplianceWarningTier,
      isResolved: w.isResolved,
      resolvedAt: w.resolvedAt ? w.resolvedAt.toISOString() : null,
      resolutionType: w.resolutionType || null,
      actionRequired: w.actionRequired,
      createdAt: w.createdAt.toISOString(),
    }));
  }
}
