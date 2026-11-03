import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiErrorCode } from '@ecoride/contracts';
import { FareRule } from '../../database/entities/fare-rule.entity';
import { AuditEvent } from '../../database/entities/audit-event.entity';
import { IdentityService } from '../identity/identity.service';
import { CreateFareRuleDto, ApproveFareRuleDto, RejectFareRuleDto, QueryFareRulesDto } from './dto';

export interface RuleActor {
  id: string;
  role: string;
  ipAddress?: string;
  correlationId?: string;
}

@Injectable()
export class FareRulesService {
  private inMemoryRules: FareRule[] = [];

  constructor(
    @Optional()
    @InjectRepository(FareRule)
    private readonly fareRuleRepo?: Repository<FareRule>,
    @Optional()
    @InjectRepository(AuditEvent)
    private readonly auditEventRepo?: Repository<AuditEvent>,
    @Optional()
    private readonly identityService?: IdentityService,
  ) {}

  /**
   * Creates a new fare rule version in DRAFT status.
   * Ensures that PDF illustrative fares are marked isIllustrative=true and never live defaults.
   */
  async createDraft(dto: CreateFareRuleDto, actor: RuleActor): Promise<FareRule> {
    const city = dto.city.toLowerCase().trim();
    const serviceCategory = dto.serviceCategory.trim();

    // 1. Determine next version number for this (city, serviceCategory)
    let nextVersion = 1;
    if (this.fareRuleRepo) {
      const highest = await this.fareRuleRepo
        .createQueryBuilder('fr')
        .where('fr.city = :city AND fr.service_category = :serviceCategory', {
          city,
          serviceCategory,
        })
        .orderBy('fr.version', 'DESC')
        .getOne();

      if (highest) {
        nextVersion = highest.version + 1;
      }
    } else {
      const existing = this.inMemoryRules.filter(
        (r) => r.city === city && r.serviceCategory === serviceCategory,
      );
      if (existing.length > 0) {
        nextVersion = Math.max(...existing.map((r) => r.version)) + 1;
      }
    }

    const rule = new FareRule();
    rule.ruleCode = dto.ruleCode;
    rule.version = nextVersion;
    rule.city = city;
    rule.serviceCategory = serviceCategory;
    rule.status = 'DRAFT'; // Always created as DRAFT
    rule.baseFarePaise = dto.baseFarePaise;
    rule.baseDistanceMeters = dto.baseDistanceMeters ?? 1000;
    rule.perKmRatePaise = dto.perKmRatePaise;
    rule.perMinuteRatePaise = dto.perMinuteRatePaise ?? 0;
    rule.waitingChargePaisePerMinute = dto.waitingChargePaisePerMinute ?? 0;
    rule.minimumFarePaise = dto.minimumFarePaise ?? 2500;
    rule.surgeMultiplier = dto.surgeMultiplier ?? 1.0;
    rule.taxRateBps = dto.taxRateBps ?? 500; // 5.00% GST
    rule.commissionRateBps = dto.commissionRateBps ?? 1500; // 15.00% Platform
    rule.promotions = dto.promotions ?? null;
    rule.effectiveFrom = new Date(dto.effectiveFrom);
    rule.effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;
    rule.isIllustrative = dto.isIllustrative ?? false;
    rule.createdById = actor.id;
    rule.notes = dto.notes ?? null;

    let savedRule: FareRule;
    if (this.fareRuleRepo) {
      savedRule = await this.fareRuleRepo.save(rule);
    } else {
      rule.id = `rule-${Date.now()}-${nextVersion}`;
      rule.createdAt = new Date();
      rule.updatedAt = new Date();
      this.inMemoryRules.push(rule);
      savedRule = rule;
    }

    // 2. Audit Trail
    await this.recordAudit({
      actorId: actor.id,
      action: 'FARE_RULE_DRAFT_CREATED',
      entityType: 'FARE_RULE',
      entityId: savedRule.id,
      newState: {
        ruleCode: savedRule.ruleCode,
        version: savedRule.version,
        city: savedRule.city,
        serviceCategory: savedRule.serviceCategory,
        status: savedRule.status,
        baseFarePaise: savedRule.baseFarePaise,
        perKmRatePaise: savedRule.perKmRatePaise,
        isIllustrative: savedRule.isIllustrative,
      },
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
      status: 'SUCCESS',
    });

    return savedRule;
  }

  /**
   * Approves a DRAFT fare rule version with statutory evidence reference.
   * Promotes the rule to ACTIVE and marks any previous ACTIVE rule for that city & category as SUPERSEDED.
   */
  async approveRule(id: string, dto: ApproveFareRuleDto, actor: RuleActor): Promise<FareRule> {
    if (!['ADMIN', 'OPERATOR', 'SUPER_ADMIN'].includes(actor.role.toUpperCase())) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: `Role '${actor.role}' lacks authority to approve statutory fare rules. Requires ADMIN or OPERATOR.`,
      });
    }

    if (!dto.evidenceReference || dto.evidenceReference.trim().length === 0) {
      throw new BadRequestException({
        code: ApiErrorCode.INVALID_FARE_RULE,
        message:
          'A valid statutory evidence reference (e.g. AP-STA-2026-GO-42) is required to approve fare rules.',
      });
    }

    const rule = await this.getRuleById(id);

    if (rule.status !== 'DRAFT' && rule.status !== 'REJECTED') {
      throw new BadRequestException({
        code: ApiErrorCode.INVALID_FARE_RULE,
        message: `Cannot approve fare rule in '${rule.status}' status. Only DRAFT or REJECTED rules can be approved.`,
      });
    }

    // 1. Find and supersede any existing ACTIVE rule for this (city, serviceCategory)
    let previousActiveRule: FareRule | null = null;
    if (this.fareRuleRepo) {
      previousActiveRule = await this.fareRuleRepo.findOne({
        where: {
          city: rule.city,
          serviceCategory: rule.serviceCategory,
          status: 'ACTIVE',
        },
      });

      if (previousActiveRule && previousActiveRule.id !== rule.id) {
        previousActiveRule.status = 'SUPERSEDED';
        previousActiveRule.effectiveTo = new Date();
        await this.fareRuleRepo.save(previousActiveRule);

        await this.recordAudit({
          actorId: actor.id,
          action: 'FARE_RULE_SUPERSEDED',
          entityType: 'FARE_RULE',
          entityId: previousActiveRule.id,
          previousState: { status: 'ACTIVE', version: previousActiveRule.version },
          newState: { status: 'SUPERSEDED', version: previousActiveRule.version },
          ipAddress: actor.ipAddress,
          correlationId: actor.correlationId,
          status: 'SUCCESS',
        });
      }
    } else {
      previousActiveRule =
        this.inMemoryRules.find(
          (r) =>
            r.city === rule.city &&
            r.serviceCategory === rule.serviceCategory &&
            r.status === 'ACTIVE' &&
            r.id !== rule.id,
        ) || null;

      if (previousActiveRule) {
        previousActiveRule.status = 'SUPERSEDED';
        previousActiveRule.effectiveTo = new Date();
      }
    }

    // 2. Promote target rule to ACTIVE
    rule.status = 'ACTIVE';
    rule.approvedById = actor.id;
    rule.approvedAt = new Date();
    rule.evidenceReference = dto.evidenceReference.trim();
    if (dto.notes) {
      rule.notes = dto.notes.trim();
    }

    let savedRule: FareRule;
    if (this.fareRuleRepo) {
      savedRule = await this.fareRuleRepo.save(rule);
    } else {
      rule.updatedAt = new Date();
      savedRule = rule;
    }

    await this.recordAudit({
      actorId: actor.id,
      action: 'FARE_RULE_APPROVED',
      entityType: 'FARE_RULE',
      entityId: savedRule.id,
      previousState: { status: 'DRAFT', version: savedRule.version },
      newState: {
        status: 'ACTIVE',
        version: savedRule.version,
        evidenceReference: savedRule.evidenceReference,
        approvedById: savedRule.approvedById,
        approvedAt: savedRule.approvedAt,
      },
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
      status: 'SUCCESS',
    });

    return savedRule;
  }

  /**
   * Rejects a proposed DRAFT fare rule.
   */
  async rejectRule(id: string, dto: RejectFareRuleDto, actor: RuleActor): Promise<FareRule> {
    if (!['ADMIN', 'OPERATOR', 'SUPER_ADMIN'].includes(actor.role.toUpperCase())) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: `Role '${actor.role}' lacks authority to reject fare rules. Requires ADMIN or OPERATOR.`,
      });
    }

    const rule = await this.getRuleById(id);

    if (rule.status !== 'DRAFT') {
      throw new BadRequestException({
        code: ApiErrorCode.INVALID_FARE_RULE,
        message: `Cannot reject fare rule in '${rule.status}' status. Only DRAFT rules can be rejected.`,
      });
    }

    rule.status = 'REJECTED';
    rule.rejectionReason = dto.rejectionReason.trim();

    let savedRule: FareRule;
    if (this.fareRuleRepo) {
      savedRule = await this.fareRuleRepo.save(rule);
    } else {
      rule.updatedAt = new Date();
      savedRule = rule;
    }

    await this.recordAudit({
      actorId: actor.id,
      action: 'FARE_RULE_REJECTED',
      entityType: 'FARE_RULE',
      entityId: savedRule.id,
      previousState: { status: 'DRAFT', version: savedRule.version },
      newState: {
        status: 'REJECTED',
        version: savedRule.version,
        rejectionReason: savedRule.rejectionReason,
      },
      ipAddress: actor.ipAddress,
      correlationId: actor.correlationId,
      status: 'SUCCESS',
    });

    return savedRule;
  }

  /**
   * Retrieves the currently active, approved fare rule for a city and category at a given point in time.
   * Strictly ignores DRAFT and unapproved illustrative rules.
   */
  async getActiveRule(
    city: string,
    serviceCategory: string,
    atDate: Date = new Date(),
  ): Promise<FareRule | null> {
    const normalizedCity = city.toLowerCase().trim();
    const normalizedCategory = serviceCategory.trim();

    if (this.fareRuleRepo) {
      const qb = this.fareRuleRepo
        .createQueryBuilder('fr')
        .where('fr.city = :city', { city: normalizedCity })
        .andWhere('fr.service_category = :serviceCategory', { serviceCategory: normalizedCategory })
        .andWhere('fr.status = :status', { status: 'ACTIVE' })
        .andWhere('fr.effective_from <= :atDate', { atDate })
        .andWhere('(fr.effective_to IS NULL OR fr.effective_to >= :atDate)', { atDate })
        .orderBy('fr.version', 'DESC');

      const rule = await qb.getOne();
      return rule || null;
    }

    // In-memory fallback
    const rule = this.inMemoryRules.find(
      (r) =>
        r.city === normalizedCity &&
        r.serviceCategory === normalizedCategory &&
        r.status === 'ACTIVE' &&
        r.effectiveFrom <= atDate &&
        (!r.effectiveTo || r.effectiveTo >= atDate),
    );

    return rule || null;
  }

  /**
   * Retrieves a single fare rule by UUID.
   */
  async getRuleById(id: string): Promise<FareRule> {
    if (this.fareRuleRepo) {
      const rule = await this.fareRuleRepo.findOne({ where: { id } });
      if (!rule) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Fare rule with ID '${id}' not found.`,
        });
      }
      return rule;
    }

    const rule = this.inMemoryRules.find((r) => r.id === id);
    if (!rule) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Fare rule with ID '${id}' not found.`,
      });
    }
    return rule;
  }

  /**
   * Lists fare rules matching optional city, service category, or status filters.
   */
  async listRules(query: QueryFareRulesDto): Promise<FareRule[]> {
    if (this.fareRuleRepo) {
      const qb = this.fareRuleRepo.createQueryBuilder('fr');

      if (query.city) {
        qb.andWhere('fr.city = :city', { city: query.city.toLowerCase().trim() });
      }
      if (query.serviceCategory) {
        qb.andWhere('fr.service_category = :serviceCategory', {
          serviceCategory: query.serviceCategory.trim(),
        });
      }
      if (query.status) {
        qb.andWhere('fr.status = :status', { status: query.status });
      }

      qb.orderBy('fr.city', 'ASC')
        .addOrderBy('fr.service_category', 'ASC')
        .addOrderBy('fr.version', 'DESC');

      return qb.getMany();
    }

    return this.inMemoryRules.filter((r) => {
      if (query.city && r.city !== query.city.toLowerCase().trim()) return false;
      if (query.serviceCategory && r.serviceCategory !== query.serviceCategory.trim()) return false;
      if (query.status && r.status !== query.status) return false;
      return true;
    });
  }

  /**
   * Retrieves audit events recorded against a specific fare rule.
   */
  async getRuleAuditTrail(id: string): Promise<AuditEvent[]> {
    if (this.auditEventRepo) {
      return this.auditEventRepo.find({
        where: { entityType: 'FARE_RULE', entityId: id },
        order: { createdAt: 'DESC' },
      });
    }
    return [];
  }

  private async recordAudit(data: Partial<AuditEvent>): Promise<void> {
    if (this.identityService) {
      await this.identityService.recordAuditEvent(data);
    } else if (this.auditEventRepo) {
      const event = this.auditEventRepo.create(data);
      await this.auditEventRepo.save(event);
    }
  }
}
