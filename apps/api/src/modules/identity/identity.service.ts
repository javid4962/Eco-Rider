import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  User,
  Role,
  RiderProfile,
  DriverProfile,
  Session,
  Consent,
  AuditEvent,
} from '../../database/entities';
import {
  PlatformRole,
  ROLE_SCOPES,
  UpdateRiderProfileRequest,
  UpdateDriverProfileRequest,
} from '@ecoride/contracts';
import { CurrentActorPayload } from './current-actor.decorator';
import * as crypto from 'crypto';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RiderProfile)
    private readonly riderProfileRepository: Repository<RiderProfile>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(Consent)
    private readonly consentRepository: Repository<Consent>,
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Enforces strict ownership rules:
   * 1. Self-ownership: Actor can access their own account data (actor.id === targetUserId).
   * 2. Administrative override: SUPER_ADMIN has full access.
   * 3. Operational scope: Actor has a specific permission scope (e.g. 'rider:read' for SUPPORT).
   *
   * If unauthorized, logs a security audit event and throws ForbiddenException.
   */
  async assertCanAccessUser(
    actor: CurrentActorPayload,
    targetUserId: string,
    requiredScope?: string,
    actionName = 'DATA_ACCESS',
  ): Promise<void> {
    // 1. Self ownership
    if (actor.id === targetUserId) {
      return;
    }

    // 2. Super admin access
    if (actor.role === PlatformRole.SUPER_ADMIN || actor.scopes.includes('*')) {
      return;
    }

    // 3. Granular administrative scope match (must NOT be a :self scope)
    if (requiredScope && !requiredScope.endsWith(':self') && actor.scopes.includes(requiredScope)) {
      return;
    }

    // 4. UNAUTHORIZED CROSS-ACCOUNT ACCESS ATTEMPT: Log audit event and reject
    this.logger.warn(
      `Cross-account access rejected: actor ${actor.id} (${actor.role}) tried to access target user ${targetUserId} without scope ${requiredScope || 'self'}`,
    );

    try {
      await this.recordAuditEvent({
        actorId: actor.id,
        targetUserId,
        action: 'CROSS_ACCOUNT_ACCESS_DENIED',
        entityType: 'USER',
        entityId: targetUserId,
        previousState: { requestedAction: actionName, requiredScope },
        ipAddress: actor.ipAddress,
        correlationId: actor.correlationId,
        status: 'DENIED',
        failureReason: `Unauthorized cross-account access attempt by role ${actor.role}`,
      });
    } catch (auditErr) {
      this.logger.error('Failed to persist cross-account denial audit event', auditErr);
    }

    throw new ForbiddenException(
      'Access denied: You are not authorized to view or modify this user account',
    );
  }

  /**
   * Enforces role modification authority: Only SUPER_ADMIN can modify user roles.
   */
  async assertCanChangeRole(actor: CurrentActorPayload, targetUserId: string): Promise<void> {
    if (actor.role === PlatformRole.SUPER_ADMIN || actor.scopes.includes('*')) {
      return;
    }

    this.logger.warn(
      `Role modification rejected: actor ${actor.id} (${actor.role}) tried to change role for user ${targetUserId}`,
    );

    try {
      await this.recordAuditEvent({
        actorId: actor.id,
        targetUserId,
        action: 'ROLE_CHANGE_DENIED',
        entityType: 'USER',
        entityId: targetUserId,
        ipAddress: actor.ipAddress,
        correlationId: actor.correlationId,
        status: 'DENIED',
        failureReason: `Actor ${actor.role} lacks SUPER_ADMIN governance privilege`,
      });
    } catch (auditErr) {
      this.logger.error('Failed to persist role change denial audit event', auditErr);
    }

    throw new ForbiddenException('Access denied: Only SUPER_ADMIN can change user roles');
  }

  /**
   * Retrieve a user by ID with attached rider and driver profiles.
   */
  async getUserProfile(actor: CurrentActorPayload, targetUserId: string) {
    await this.assertCanAccessUser(actor, targetUserId, 'rider:read', 'GET_USER_PROFILE');

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['riderProfile', 'driverProfile'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      scopes: ROLE_SCOPES[user.role] || [],
      riderProfile: user.riderProfile || null,
      driverProfile: user.driverProfile || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Updates or creates a rider profile. Caller must be self or SUPER_ADMIN.
   */
  async updateRiderProfile(
    actor: CurrentActorPayload,
    targetUserId: string,
    dto: UpdateRiderProfileRequest,
  ) {
    await this.assertCanAccessUser(actor, targetUserId, 'rider:write', 'UPDATE_RIDER_PROFILE');

    let profile = await this.riderProfileRepository.findOne({ where: { userId: targetUserId } });
    const isNew = !profile;

    if (!profile) {
      profile = this.riderProfileRepository.create({
        userId: targetUserId,
        preferredPaymentMode: dto.preferredPaymentMode || 'CASH_OR_UPI',
        accessibilityNeeds: dto.accessibilityNeeds ?? false,
      });
    }

    const previousState = isNew ? undefined : { ...profile };

    if (dto.emergencyContactName !== undefined) {
      profile.emergencyContactName = dto.emergencyContactName;
    }
    if (dto.emergencyContactPhone !== undefined) {
      profile.emergencyContactPhone = dto.emergencyContactPhone;
    }
    if (dto.preferredPaymentMode !== undefined) {
      profile.preferredPaymentMode = dto.preferredPaymentMode;
    }
    if (dto.defaultPickupNotes !== undefined) {
      profile.defaultPickupNotes = dto.defaultPickupNotes;
    }
    if (dto.accessibilityNeeds !== undefined) {
      profile.accessibilityNeeds = dto.accessibilityNeeds;
    }

    const saved = await this.riderProfileRepository.save(profile);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: isNew ? 'RIDER_PROFILE_CREATED' : 'RIDER_PROFILE_UPDATED',
      entityType: 'RIDER_PROFILE',
      entityId: saved.id,
      previousState: previousState as Record<string, unknown>,
      newState: { ...saved } as Record<string, unknown>,
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
      status: 'SUCCESS',
    });

    return saved;
  }

  /**
   * Updates or creates a driver profile.
   */
  async updateDriverProfile(
    actor: CurrentActorPayload,
    targetUserId: string,
    dto: UpdateDriverProfileRequest,
  ) {
    await this.assertCanAccessUser(actor, targetUserId, 'driver:write', 'UPDATE_DRIVER_PROFILE');

    const profile = await this.driverProfileRepository.findOne({ where: { userId: targetUserId } });
    if (!profile) {
      throw new NotFoundException(`Driver profile for user ${targetUserId} not found`);
    }

    const previousState = { ...profile };

    if (dto.badgeNumber !== undefined) {
      profile.badgeNumber = dto.badgeNumber;
    }
    if (dto.city !== undefined) {
      profile.city = dto.city;
    }
    if (dto.assignedVehicleId !== undefined) {
      profile.assignedVehicleId = dto.assignedVehicleId;
    }

    const saved = await this.driverProfileRepository.save(profile);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: 'DRIVER_PROFILE_UPDATED',
      entityType: 'DRIVER_PROFILE',
      entityId: saved.id,
      previousState: previousState as Record<string, unknown>,
      newState: { ...saved } as Record<string, unknown>,
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
      status: 'SUCCESS',
    });

    return saved;
  }

  /**
   * Atomically updates a user's role and logs an authoritative audit event.
   * Only SUPER_ADMIN can invoke this.
   */
  async changeUserRole(
    actor: CurrentActorPayload,
    targetUserId: string,
    newRole: string,
    reason: string,
  ) {
    await this.assertCanChangeRole(actor, targetUserId);

    // Validate that the role exists
    const validRoles = Object.values(PlatformRole) as string[];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(
        `Invalid role: ${newRole}. Must be one of: ${validRoles.join(', ')}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, { where: { id: targetUserId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${targetUserId} not found`);
      }

      const previousRole = user.role;
      user.role = newRole;
      await queryRunner.manager.save(User, user);

      // Record audit event within the transaction
      const audit = queryRunner.manager.create(AuditEvent, {
        actorId: actor.id,
        targetUserId,
        action: 'ROLE_CHANGED',
        entityType: 'USER',
        entityId: targetUserId,
        previousState: { role: previousRole },
        newState: { role: newRole, reason },
        ipAddress: actor.ipAddress,
        correlationId: actor.correlationId,
        status: 'SUCCESS',
      });
      await queryRunner.manager.save(AuditEvent, audit);

      await queryRunner.commitTransaction();

      this.logger.log(
        `[AUDIT] User ${targetUserId} role updated from ${previousRole} to ${newRole} by actor ${actor.id}. Reason: "${reason}"`,
      );

      return {
        userId: user.id,
        previousRole,
        newRole,
        reason,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create an authenticated session for a user.
   */
  async createSession(
    userId: string,
    platform: string,
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = this.sessionRepository.create({
      userId,
      tokenHash,
      platform: platform || 'WEB',
      deviceId,
      ipAddress,
      userAgent,
      expiresAt,
    });

    const saved = await this.sessionRepository.save(session);
    return {
      session: saved,
      rawToken, // Sent to client once
    };
  }

  /**
   * List active sessions for a user. Ownership enforced.
   */
  async getUserSessions(actor: CurrentActorPayload, targetUserId: string) {
    await this.assertCanAccessUser(actor, targetUserId, 'session:read', 'GET_USER_SESSIONS');

    return this.sessionRepository.find({
      where: { userId: targetUserId, isRevoked: false },
      order: { lastActiveAt: 'DESC' },
    });
  }

  /**
   * Revoke an active session. Caller must be self or SUPER_ADMIN.
   */
  async revokeSession(actor: CurrentActorPayload, targetUserId: string, sessionId: string) {
    await this.assertCanAccessUser(actor, targetUserId, 'session:revoke', 'REVOKE_SESSION');

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId: targetUserId },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    session.isRevoked = true;
    await this.sessionRepository.save(session);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: 'SESSION_REVOKED',
      entityType: 'SESSION',
      entityId: sessionId,
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
      status: 'SUCCESS',
    });

    return { success: true, sessionId, isRevoked: true };
  }

  /**
   * Record or update user data consent. Caller must be self.
   */
  async recordConsent(
    actor: CurrentActorPayload,
    targetUserId: string,
    consentType: string,
    consentVersion: string,
    isGranted: boolean,
  ) {
    await this.assertCanAccessUser(actor, targetUserId, 'consent:write:self', 'RECORD_CONSENT');

    let consent = await this.consentRepository.findOne({
      where: { userId: targetUserId, consentType, consentVersion },
    });

    const isNew = !consent;
    const previousState = isNew ? undefined : { ...consent };

    if (!consent) {
      consent = this.consentRepository.create({
        userId: targetUserId,
        consentType,
        consentVersion,
        isGranted,
        ipAddress: actor.ipAddress,
        grantedAt: new Date(),
      });
    } else {
      consent.isGranted = isGranted;
      if (!isGranted) {
        consent.revokedAt = new Date();
      } else {
        consent.revokedAt = undefined;
        consent.grantedAt = new Date();
      }
    }

    const saved = await this.consentRepository.save(consent);

    await this.recordAuditEvent({
      actorId: actor.id,
      targetUserId,
      action: isGranted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      entityType: 'CONSENT',
      entityId: saved.id,
      previousState: previousState as Record<string, unknown>,
      newState: { ...saved } as Record<string, unknown>,
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
      status: 'SUCCESS',
    });

    return saved;
  }

  /**
   * Get user consents. Caller must be self, SUPPORT, or SUPER_ADMIN.
   */
  async getUserConsents(actor: CurrentActorPayload, targetUserId: string) {
    await this.assertCanAccessUser(actor, targetUserId, 'consent:read', 'GET_USER_CONSENTS');

    return this.consentRepository.find({
      where: { userId: targetUserId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Query authoritative audit events. Caller must be SUPER_ADMIN or SAFETY_OFFICER.
   */
  async getAuditEvents(
    actor: CurrentActorPayload,
    options?: { targetUserId?: string; action?: string; limit?: number },
  ) {
    const isSuperAdmin = actor.role === PlatformRole.SUPER_ADMIN || actor.scopes.includes('*');
    const isSafety = actor.scopes.includes('audit:read');

    if (!isSuperAdmin && !isSafety) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to view identity audit events',
      );
    }

    const query = this.auditEventRepository.createQueryBuilder('ae');

    if (options?.targetUserId) {
      query.andWhere('ae.target_user_id = :targetUserId', { targetUserId: options.targetUserId });
    }
    if (options?.action) {
      query.andWhere('ae.action = :action', { action: options.action });
    }

    query.orderBy('ae.created_at', 'DESC').take(options?.limit || 50);

    return query.getMany();
  }

  /**
   * Helper to write an audit event.
   */
  async recordAuditEvent(data: Partial<AuditEvent>): Promise<AuditEvent> {
    const event = this.auditEventRepository.create(data);
    return this.auditEventRepository.save(event);
  }

  /**
   * Return configured roles and scopes.
   */
  async getRoles() {
    return this.roleRepository.find({ order: { id: 'ASC' } });
  }
}
