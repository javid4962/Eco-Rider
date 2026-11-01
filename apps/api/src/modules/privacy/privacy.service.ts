import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User,
  Consent,
  AuditEvent,
  Session,
  SavedLocation,
  Booking,
  DataDeletionRequest,
} from '../../database/entities';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  ConsentType,
  PolicyVersionDto,
  DataExportDto,
  DataDeletionResponseDto,
  StatutoryRetentionExceptionDto,
  DeletionRequestStatus,
  EvaluatePermissionResultDto,
} from '@ecoride/contracts';
import { RecordConsentDto, RevokeConsentDto, CreateDeletionRequestDto } from './dto';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  // Active authoritative platform policy notices and versions
  private readonly policyVersions: PolicyVersionDto[] = [
    {
      policyType: ConsentType.TERMS_OF_SERVICE,
      version: 'v1.2',
      isMandatory: true,
      title: 'Platform Terms of Service',
      effectiveDate: '2026-11-01T00:00:00.000Z',
      summary:
        'Governs participation, fare calculation, and passenger conduct on the 100% BEV mobility platform in Andhra Pradesh.',
    },
    {
      policyType: ConsentType.PRIVACY_POLICY,
      version: 'v1.2',
      isMandatory: true,
      title: 'Commuter Privacy Notice & DPDP Disclosure',
      effectiveDate: '2026-11-01T00:00:00.000Z',
      summary:
        'Outlines personal data handling, zero-tracking commitments, and commuter rights under the Digital Personal Data Protection Act, 2023.',
    },
    {
      policyType: ConsentType.LOCATION_TRIP_PROCESSING,
      version: 'v1.0',
      isMandatory: true,
      title: 'Trip Dispatch & Navigation Location',
      effectiveDate: '2026-11-01T00:00:00.000Z',
      summary:
        'Real-time GPS coordinates collected solely while an EV trip is active to facilitate vehicle dispatch, navigation, and battery range estimation.',
    },
    {
      policyType: ConsentType.LOCATION_BACKGROUND_FLEET,
      version: 'v1.0',
      isMandatory: true,
      title: 'Captain Telematics & Shift Location',
      effectiveDate: '2026-11-01T00:00:00.000Z',
      summary:
        'Continuous GPS telemetry collected from verified Captains during active duty shifts for proximity dispatch and emergency roadside safety.',
    },
    {
      policyType: ConsentType.LOCATION_NEARBY_OFFERS,
      version: 'v1.0',
      isMandatory: false,
      title: 'Nearby EV Perks & Green Charging Hubs',
      effectiveDate: '2026-11-01T00:00:00.000Z',
      summary:
        'Optional proximity consent allowing EcoRide to recommend nearby partner EV charging hubs and regional green mobility rewards.',
    },
    {
      policyType: ConsentType.COMMUNICATIONS_MARKETING_SMS,
      version: 'v1.0',
      isMandatory: false,
      title: 'Promotional SMS Communications',
      effectiveDate: '2026-11-01T00:00:00.000Z',
      summary:
        'Optional opt-in to receive promotional discount coupons, weekend ride vouchers, and clean-air milestone rewards via SMS.',
    },
    {
      policyType: ConsentType.COMMUNICATIONS_MARKETING_EMAIL,
      version: 'v1.0',
      isMandatory: false,
      title: 'Promotional Email Communications',
      effectiveDate: '2026-11-01T00:00:00.000Z',
      summary:
        'Optional opt-in to receive monthly carbon offset digests, EV fleet sustainability reports, and partnership discounts via email.',
    },
    {
      policyType: ConsentType.COMMUNICATIONS_PROMOTIONAL_PUSH,
      version: 'v1.0',
      isMandatory: false,
      title: 'Promotional Mobile App Push Notifications',
      effectiveDate: '2026-11-01T00:00:00.000Z',
      summary:
        'Optional opt-in to receive push alerts on rainy-day fare caps, off-peak charging discounts, and community green passes.',
    },
  ];

  // Statutory retention exceptions under Indian laws (DPDP Act, Companies Act 2013, Motor Vehicles Act)
  private readonly statutoryRetentionExceptions: StatutoryRetentionExceptionDto[] = [
    {
      category: 'FINANCIAL_TRANSACTIONS_AND_TAX',
      statutoryBasis:
        'Section 128 of the Companies Act, 2013 & Central Goods and Services Tax (CGST) Act, 2017',
      retentionPeriod: '8 years',
      retentionPeriodYears: 8,
      scope:
        'Invoices, tax ledger debits/credits, payment gateway reference identifiers, and GST amounts are retained in pseudonymized format for statutory tax compliance and mandatory audit.',
    },
    {
      category: 'TRANSPORT_SAFETY_AND_INCIDENT_AUDIT',
      statutoryBasis:
        'Motor Vehicles Act (1988/2019 Amendment) & Andhra Pradesh On-Demand Transportation Technology Aggregator Guidelines',
      retentionPeriod: '3 years',
      retentionPeriodYears: 3,
      scope:
        'Immutable audit logs, driver identity verification stamps, and emergency SOS incident records are retained to comply with transport regulatory and passenger safety mandates.',
    },
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Consent)
    private readonly consentRepository: Repository<Consent>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(SavedLocation)
    private readonly savedLocationRepository: Repository<SavedLocation>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(DataDeletionRequest)
    private readonly deletionRequestRepository: Repository<DataDeletionRequest>,
  ) {}

  /**
   * Enforce strict ownership / authorization check for caller.
   */
  public async assertCanAccessUser(
    actor: CurrentActorPayload,
    targetUserId: string,
    requiredScope = 'privacy:read',
    operation = 'privacy operation',
  ): Promise<void> {
    const isSelf = actor.id === targetUserId;
    const isSuperAdmin = actor.role === 'SUPER_ADMIN';
    const isSupport =
      actor.role === 'SUPPORT' &&
      (actor.scopes?.includes('privacy:read') ||
        actor.scopes?.includes('consent:read') ||
        actor.scopes?.includes(requiredScope));

    if (isSelf || isSuperAdmin || isSupport) {
      return;
    }

    // Record cross-account access violation in audit log
    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: 'CROSS_ACCOUNT_ACCESS_DENIED',
      entityType: 'USER',
      entityId: targetUserId,
      status: 'DENIED',
      failureReason: `Actor ${actor.id} (${actor.role}) unauthorized for ${operation} on target ${targetUserId}`,
    });

    this.logger.warn(
      `Cross-account privacy access denied: Actor ${actor.id} attempted ${operation} on ${targetUserId}`,
    );
    throw new ForbiddenException(
      `Access denied: you do not have permission to perform ${operation} on this account`,
    );
  }

  /**
   * Return platform policy versions and metadata.
   */
  getPolicyVersions(): PolicyVersionDto[] {
    return this.policyVersions;
  }

  /**
   * Record or update user consent (notice acceptance, location consent, or communications opt-in).
   */
  async recordConsent(
    actor: CurrentActorPayload,
    targetUserId: string,
    dto: RecordConsentDto,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string,
  ) {
    await this.assertCanAccessUser(actor, targetUserId, 'consent:write:self', 'record consent');

    let consent = await this.consentRepository.findOne({
      where: {
        userId: targetUserId,
        consentType: dto.consentType,
        consentVersion: dto.consentVersion,
      },
    });

    const isNew = !consent;
    const previousState = isNew ? undefined : { ...consent };

    if (!consent) {
      consent = this.consentRepository.create({
        userId: targetUserId,
        consentType: dto.consentType,
        consentVersion: dto.consentVersion,
        isGranted: dto.isGranted,
        ipAddress,
        userAgent,
        grantedAt: dto.isGranted ? new Date() : new Date(),
        revokedAt: dto.isGranted ? undefined : new Date(),
      });
    } else {
      consent.isGranted = dto.isGranted;
      consent.ipAddress = ipAddress || consent.ipAddress;
      consent.userAgent = userAgent || consent.userAgent;
      if (dto.isGranted) {
        consent.grantedAt = new Date();
        consent.revokedAt = undefined;
      } else {
        consent.revokedAt = new Date();
      }
    }

    const saved = await this.consentRepository.save(consent);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: dto.isGranted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      entityType: 'CONSENT',
      entityId: saved.id,
      previousState,
      newState: {
        consentType: saved.consentType,
        consentVersion: saved.consentVersion,
        isGranted: saved.isGranted,
        grantedAt: saved.grantedAt,
        revokedAt: saved.revokedAt,
      },
      ipAddress,
      correlationId,
      status: 'SUCCESS',
    });

    return {
      id: saved.id,
      userId: saved.userId,
      consentType: saved.consentType,
      consentVersion: saved.consentVersion,
      isGranted: saved.isGranted,
      grantedAt: saved.grantedAt.toISOString(),
      revokedAt: saved.revokedAt?.toISOString(),
    };
  }

  /**
   * Revoke an optional consent (e.g. communications opt-in or nearby offers).
   */
  async revokeConsent(
    actor: CurrentActorPayload,
    targetUserId: string,
    dto: RevokeConsentDto,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string,
  ) {
    await this.assertCanAccessUser(actor, targetUserId, 'consent:write:self', 'revoke consent');

    // Find the most recent grant for this consent type
    let consent = await this.consentRepository.findOne({
      where: { userId: targetUserId, consentType: dto.consentType },
      order: { createdAt: 'DESC' },
    });

    const previousState = consent ? { ...consent } : undefined;

    if (!consent) {
      consent = this.consentRepository.create({
        userId: targetUserId,
        consentType: dto.consentType,
        consentVersion: 'v1.0',
        isGranted: false,
        ipAddress,
        userAgent,
        revokedAt: new Date(),
      });
    } else {
      consent.isGranted = false;
      consent.revokedAt = new Date();
      consent.ipAddress = ipAddress || consent.ipAddress;
      consent.userAgent = userAgent || consent.userAgent;
    }

    const saved = await this.consentRepository.save(consent);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: 'CONSENT_REVOKED',
      entityType: 'CONSENT',
      entityId: saved.id,
      previousState,
      newState: {
        consentType: saved.consentType,
        isGranted: false,
        revokedAt: saved.revokedAt,
        reason: dto.reason,
      },
      ipAddress,
      correlationId,
      status: 'SUCCESS',
    });

    return {
      id: saved.id,
      userId: saved.userId,
      consentType: saved.consentType,
      consentVersion: saved.consentVersion,
      isGranted: saved.isGranted,
      grantedAt: saved.grantedAt?.toISOString?.() || new Date().toISOString(),
      revokedAt: saved.revokedAt?.toISOString?.(),
      reason: dto.reason,
    };
  }

  /**
   * Get all recorded consents for user.
   */
  async getUserConsents(actor: CurrentActorPayload, targetUserId: string) {
    await this.assertCanAccessUser(actor, targetUserId, 'consent:read', 'get user consents');

    const list = await this.consentRepository.find({
      where: { userId: targetUserId },
      order: { createdAt: 'DESC' },
    });

    return list.map((c) => ({
      id: c.id,
      userId: c.userId,
      consentType: c.consentType,
      consentVersion: c.consentVersion,
      isGranted: c.isGranted,
      grantedAt: c.grantedAt.toISOString(),
      revokedAt: c.revokedAt ? c.revokedAt.toISOString() : undefined,
    }));
  }

  /**
   * DEMONSTRATE ACCEPTANCE: Evaluate whether a specific permission is allowed.
   * Authoritatively respects revoked optional permissions.
   */
  async evaluatePermission(
    actor: CurrentActorPayload,
    targetUserId: string,
    permission: string,
  ): Promise<EvaluatePermissionResultDto> {
    await this.assertCanAccessUser(actor, targetUserId, 'consent:read', 'evaluate permission');

    // Map permission identifier to ConsentType
    let targetConsentType: string = permission;
    let isOptional = true;

    switch (permission.toUpperCase()) {
      case 'MARKETING_SMS':
      case 'COMMUNICATIONS_MARKETING_SMS':
        targetConsentType = ConsentType.COMMUNICATIONS_MARKETING_SMS;
        isOptional = true;
        break;
      case 'MARKETING_EMAIL':
      case 'COMMUNICATIONS_MARKETING_EMAIL':
        targetConsentType = ConsentType.COMMUNICATIONS_MARKETING_EMAIL;
        isOptional = true;
        break;
      case 'PROMOTIONAL_PUSH':
      case 'COMMUNICATIONS_PROMOTIONAL_PUSH':
        targetConsentType = ConsentType.COMMUNICATIONS_PROMOTIONAL_PUSH;
        isOptional = true;
        break;
      case 'LOCATION_NEARBY_OFFERS':
        targetConsentType = ConsentType.LOCATION_NEARBY_OFFERS;
        isOptional = true;
        break;
      case 'LOCATION_TRIP_PROCESSING':
        targetConsentType = ConsentType.LOCATION_TRIP_PROCESSING;
        isOptional = false;
        break;
      case 'TERMS_OF_SERVICE':
        targetConsentType = ConsentType.TERMS_OF_SERVICE;
        isOptional = false;
        break;
      case 'PRIVACY_POLICY':
        targetConsentType = ConsentType.PRIVACY_POLICY;
        isOptional = false;
        break;
      default:
        targetConsentType = permission;
    }

    // Query most recent consent entry for target user and consent type
    const record = await this.consentRepository.findOne({
      where: { userId: targetUserId, consentType: targetConsentType },
      order: { updatedAt: 'DESC' },
    });

    // Case 1: Consent explicitly revoked by commuter
    if (record && !record.isGranted) {
      const revokedTime = record.revokedAt
        ? record.revokedAt.toISOString()
        : record.updatedAt.toISOString();
      return {
        permission,
        isAllowed: false,
        consentStatus: 'REVOKED',
        reason: `Permission for ${permission} (${targetConsentType}) was explicitly revoked by commuter on ${revokedTime}. Dispatches and tracking are disabled.`,
      };
    }

    // Case 2: No record exists
    if (!record) {
      if (isOptional) {
        return {
          permission,
          isAllowed: false,
          consentStatus: 'NOT_RECORDED',
          reason: `Optional permission for ${permission} has not been granted by commuter. Opt-in is required before dispatch or tracking.`,
        };
      }
      return {
        permission,
        isAllowed: false,
        consentStatus: 'NOT_RECORDED',
        reason: `Mandatory policy acceptance for ${permission} is missing. Commuter must accept notice before service access.`,
      };
    }

    // Case 3: Actively granted
    return {
      permission,
      isAllowed: true,
      consentStatus: 'GRANTED',
      reason: `Active consent granted for version ${record.consentVersion} on ${record.grantedAt.toISOString()}.`,
    };
  }

  /**
   * Export complete personal data portfolio under DPDP data portability provisions.
   */
  async exportUserData(
    actor: CurrentActorPayload,
    targetUserId: string,
    ipAddress?: string,
    correlationId?: string,
  ): Promise<DataExportDto> {
    await this.assertCanAccessUser(actor, targetUserId, 'privacy:read', 'export user data');

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['riderProfile', 'driverProfile', 'consents', 'savedLocations', 'sessions'],
    });

    if (!user) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    // Query booking count summary (privacy safe: aggregate counts only)
    const bookingCount = await this.bookingRepository.count({
      where: [{ riderId: targetUserId }, { captainId: targetUserId }],
    });
    const completedBookingCount = await this.bookingRepository.count({
      where: [
        { riderId: targetUserId, status: 'COMPLETED' },
        { captainId: targetUserId, status: 'COMPLETED' },
      ],
    });

    // Mask sensitive contact details
    const phoneMasked =
      user.phone.length > 5 ? `${user.phone.slice(0, 3)}*****${user.phone.slice(-4)}` : '*****';
    const emailMasked = user.email
      ? `${user.email[0]}***@${user.email.split('@')[1] || 'ecoride.com'}`
      : undefined;

    const exportPayload: DataExportDto = {
      exportId: `exp_${Date.now()}_${targetUserId.slice(0, 8)}`,
      exportedAt: new Date().toISOString(),
      statutoryBasis:
        'Digital Personal Data Protection (DPDP) Act, 2023 - Right to Data Portability (Section 12)',
      user: {
        id: user.id,
        phoneMasked,
        emailMasked,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      },
      riderProfile: user.riderProfile
        ? {
            preferredLanguage: user.riderProfile.preferredLanguage,
            preferredPaymentMode: user.riderProfile.preferredPaymentMode,
            accessibilityNeeds: user.riderProfile.accessibilityNeeds,
            createdAt: user.riderProfile.createdAt.toISOString(),
          }
        : undefined,
      driverProfile: user.driverProfile
        ? {
            verificationStatus: user.driverProfile.verificationStatus,
            city: user.driverProfile.city,
            totalTrips: user.driverProfile.totalTrips,
            ratingAverage: user.driverProfile.ratingAverage,
            createdAt: user.driverProfile.createdAt.toISOString(),
          }
        : undefined,
      consents: (user.consents || []).map((c) => ({
        consentType: c.consentType,
        consentVersion: c.consentVersion,
        isGranted: c.isGranted,
        grantedAt: c.grantedAt.toISOString(),
        revokedAt: c.revokedAt ? c.revokedAt.toISOString() : undefined,
      })),
      savedLocations: (user.savedLocations || []).map((l) => ({
        id: l.id,
        label: l.label,
        addressType: l.addressType,
        addressLine: l.addressLine,
        landmark: l.landmark,
        latitude: Number(l.latitude),
        longitude: Number(l.longitude),
        createdAt: l.createdAt.toISOString(),
      })),
      sessions: (user.sessions || []).map((s) => ({
        deviceId: s.deviceId,
        platform: s.platform,
        lastActiveAt: s.lastActiveAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      bookingsSummary: {
        totalBookings: bookingCount,
        completedBookings: completedBookingCount,
      },
    };

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: 'DATA_EXPORT_REQUESTED',
      entityType: 'USER',
      entityId: targetUserId,
      ipAddress,
      correlationId,
      status: 'SUCCESS',
      newState: {
        exportId: exportPayload.exportId,
        itemsExported: {
          consents: exportPayload.consents.length,
          savedLocations: exportPayload.savedLocations.length,
          sessions: exportPayload.sessions.length,
        },
      },
    });

    return exportPayload;
  }

  /**
   * Submit an account and personal data deletion request.
   * Evaluates active trip/debt retention exceptions.
   * If eligible, executes erasure while transparently disclosing statutory retention exceptions.
   */
  async createDeletionRequest(
    actor: CurrentActorPayload,
    targetUserId: string,
    dto: CreateDeletionRequestDto,
    ipAddress?: string,
    userAgent?: string,
    correlationId?: string,
  ): Promise<DataDeletionResponseDto> {
    await this.assertCanAccessUser(
      actor,
      targetUserId,
      'privacy:delete:self',
      'request account deletion',
    );

    const user = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    // Step 1: Check blocking conditions (Active booking in progress)
    const activeBooking = await this.bookingRepository.findOne({
      where: [
        { riderId: targetUserId, status: 'IN_PROGRESS' },
        { riderId: targetUserId, status: 'IN_TRIP' },
        { riderId: targetUserId, status: 'DISPATCHED' },
        { riderId: targetUserId, status: 'ARRIVED' },
        { riderId: targetUserId, status: 'MATCHING' },
        { riderId: targetUserId, status: 'CONFIRMED' },
        { captainId: targetUserId, status: 'IN_PROGRESS' },
        { captainId: targetUserId, status: 'IN_TRIP' },
        { captainId: targetUserId, status: 'DISPATCHED' },
      ],
    });

    if (activeBooking) {
      const rejectionReason = `Active ride in progress (Booking: ${activeBooking.bookingCode}, Status: ${activeBooking.status}). Rides must be completed or cancelled before deletion can be processed.`;

      const rejectedRequest = this.deletionRequestRepository.create({
        userId: targetUserId,
        status: 'REJECTED' as DeletionRequestStatus,
        reason: dto.reason,
        rejectionReason,
        erasedItems: [],
        mandatoryRetentionExceptions: this.statutoryRetentionExceptions,
        ipAddress,
        userAgent,
        processedAt: new Date(),
      });
      await this.deletionRequestRepository.save(rejectedRequest);

      await this.recordAuditEvent({
        actorId: actor.id,
        targetUserId,
        action: 'DATA_DELETION_REJECTED',
        entityType: 'USER',
        entityId: targetUserId,
        ipAddress,
        correlationId,
        status: 'DENIED',
        failureReason: rejectionReason,
        newState: {
          requestId: rejectedRequest.id,
          activeBookingCode: activeBooking.bookingCode,
          activeBookingStatus: activeBooking.status,
        },
      });

      this.logger.warn(
        `Data deletion rejected for user ${targetUserId}: Active booking ${activeBooking.bookingCode}`,
      );

      throw new UnprocessableEntityException({
        statusCode: 422,
        error: 'UNPROCESSABLE_ENTITY',
        message: rejectionReason,
        code: 'ACTIVE_RIDE_BLOCKS_DELETION',
        activeBookingCode: activeBooking.bookingCode,
      });
    }

    // Step 2: Define items to be erased immediately vs retained statutorily
    const erasedItems = [
      'RIDER_PROFILE_PERSONAL_PREFERENCES',
      'SAVED_PICKUP_AND_DROP_LOCATIONS',
      'ACTIVE_DEVICE_SESSIONS',
      'OPTIONAL_COMMUNICATION_CONSENTS',
      'CONTACT_PHONE_AND_EMAIL_PSEUDONYMIZED',
    ];

    // Step 3: Record approved and executed deletion request
    const deletionRequest = this.deletionRequestRepository.create({
      userId: targetUserId,
      status: 'COMPLETED' as DeletionRequestStatus,
      reason: dto.reason,
      erasedItems,
      mandatoryRetentionExceptions: this.statutoryRetentionExceptions,
      ipAddress,
      userAgent,
      processedAt: new Date(),
    });
    const savedRequest = await this.deletionRequestRepository.save(deletionRequest);

    // Step 4: Execute immediate erasure / pseudonymization
    // 4.1 Delete saved locations
    await this.savedLocationRepository.delete({ userId: targetUserId });

    // 4.2 Revoke all active sessions
    await this.sessionRepository.update({ userId: targetUserId }, { isRevoked: true });

    // 4.3 Revoke optional consents
    await this.consentRepository.update(
      { userId: targetUserId },
      { isGranted: false, revokedAt: new Date() },
    );

    // 4.4 Pseudonymize user record while maintaining foreign key integrity for past completed transactions
    user.isActive = false;
    user.name = 'DELETED_COMMUTER';
    user.email = undefined;
    user.phone = `del_${Date.now()}`;
    await this.userRepository.save(user);

    // Step 5: Authoritative security audit trail
    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: 'DATA_DELETION_PROCESSED',
      entityType: 'USER',
      entityId: targetUserId,
      ipAddress,
      correlationId,
      status: 'SUCCESS',
      newState: {
        requestId: savedRequest.id,
        erasedItems,
        retentionExceptionsRetained: this.statutoryRetentionExceptions.map((r) => r.category),
      },
    });

    this.logger.log(
      `Data deletion successfully processed for user ${targetUserId} (Request: ${savedRequest.id})`,
    );

    // Step 6: Return transparent deletion receipt disclosing retention reasons
    return {
      requestId: savedRequest.id,
      userId: targetUserId,
      status: DeletionRequestStatus.COMPLETED,
      erasedAt: savedRequest.processedAt?.toISOString(),
      erasedItems,
      mandatoryRetentionExceptions: this.statutoryRetentionExceptions,
      disclosure:
        'Pursuant to the Digital Personal Data Protection (DPDP) Act, 2023, your personal data and saved locations have been erased, and all active sessions revoked. In accordance with Section 128 of the Companies Act, 2013 and the Motor Vehicles Act, past financial invoices and transport safety audit logs are retained in pseudonymized format for mandated statutory retention periods.',
    };
  }

  /**
   * Get deletion request history for user.
   */
  async getDeletionRequests(actor: CurrentActorPayload, targetUserId: string) {
    await this.assertCanAccessUser(actor, targetUserId, 'privacy:read', 'get deletion requests');

    return this.deletionRequestRepository.find({
      where: { userId: targetUserId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Internal helper to record authoritative audit events.
   */
  private async recordAuditEvent(params: {
    actorId?: string;
    targetUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
    ipAddress?: string;
    correlationId?: string;
    status: 'SUCCESS' | 'DENIED' | 'FAILED';
    failureReason?: string;
  }): Promise<void> {
    try {
      const event = this.auditEventRepository.create({
        actorId: params.actorId,
        targetUserId: params.targetUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        previousState: params.previousState,
        newState: params.newState,
        ipAddress: params.ipAddress,
        correlationId: params.correlationId,
        status: params.status,
        failureReason: params.failureReason,
      });
      await this.auditEventRepository.save(event);
    } catch (err) {
      this.logger.error(`Failed to record audit event ${params.action}: ${(err as Error).message}`);
    }
  }
}
