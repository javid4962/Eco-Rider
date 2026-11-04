import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { PassPlan } from '../../database/entities/pass-plan.entity';
import { CommuterPass } from '../../database/entities/commuter-pass.entity';
import { PassRedemption } from '../../database/entities/pass-redemption.entity';
import { CorridorSeatReservation } from '../../database/entities/corridor-seat-reservation.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CommuterPassStatus,
  PassPlanDto,
  CreatePassPlanDto,
  PurchasePassDto,
  CommuterPassDto,
  RedeemPassDto,
  RedeemPassResponse,
  SlaDelayCompensationDto,
  SlaCompensationResponse,
  ApiErrorCode,
} from '@ecoride/contracts';

@Injectable()
export class CommuterPassesService {
  private readonly logger = new Logger(CommuterPassesService.name);

  constructor(
    @InjectRepository(PassPlan)
    private readonly planRepo: Repository<PassPlan>,
    @InjectRepository(CommuterPass)
    private readonly passRepo: Repository<CommuterPass>,
    @InjectRepository(PassRedemption)
    private readonly redemptionRepo: Repository<PassRedemption>,
    @InjectRepository(CorridorSeatReservation)
    private readonly reservationRepo: Repository<CorridorSeatReservation>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * EV-098: Create or register a recurring commuter pass plan.
   */
  async createPlan(dto: CreatePassPlanDto): Promise<PassPlanDto> {
    const existing = await this.planRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      return this.toPlanDto(existing);
    }

    const plan = this.planRepo.create({
      code: dto.code,
      name: dto.name,
      city: dto.city,
      passType: dto.passType,
      pricePaise: dto.pricePaise,
      validityDays: dto.validityDays || 30,
      rideLimit: dto.rideLimit || 60,
      isActive: true,
    });

    const saved = await this.planRepo.save(plan);
    this.logger.log(`[CommuterPassesService] Created pass plan: ${saved.code} (${saved.name})`);
    return this.toPlanDto(saved);
  }

  /**
   * Lists available active commuter pass plans.
   */
  async listPlans(city?: string): Promise<PassPlanDto[]> {
    const plans = await this.planRepo.find({
      where: {
        isActive: true,
        ...(city ? { city } : {}),
      },
    });
    return plans.map((p) => this.toPlanDto(p));
  }

  /**
   * EV-099 & EV-100: Purchase a personal commuter pass with advance escrow trust.
   */
  async purchasePass(
    actor: CurrentActorPayload | undefined,
    dto: PurchasePassDto,
  ): Promise<CommuterPassDto> {
    const plan = await this.planRepo.findOne({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Pass plan '${dto.planId}' not found or inactive.`,
      });
    }

    const effectiveRiderId = dto.riderId || actor?.id;
    if (!effectiveRiderId) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'A valid riderId is required to purchase a commuter pass.',
      });
    }

    const idempotencyKey =
      dto.idempotencyKey || `pass_pur_${plan.id}_${effectiveRiderId}_${Date.now()}`;

    // Replay check
    const existing = await this.passRepo.findOne({
      where: { idempotencyKey },
    });
    if (existing) {
      return this.toPassDto(existing, plan.name);
    }

    const now = new Date();
    const validUntil = new Date(now.getTime() + plan.validityDays * 24 * 60 * 60 * 1000);
    const passNumber = `PASS-AP-${now.getFullYear()}-${randomUUID().substring(0, 8).toUpperCase()}`;

    const pass = this.passRepo.create({
      passNumber,
      riderId: effectiveRiderId,
      planId: plan.id,
      status: CommuterPassStatus.ACTIVE,
      validFrom: now,
      validUntil,
      totalRides: plan.rideLimit,
      ridesRemaining: plan.rideLimit,
      pricePaise: Number(plan.pricePaise),
      idempotencyKey,
    });

    await this.dataSource.transaction(async (manager: EntityManager) => {
      await manager.save(pass);

      // Balanced Double-Entry Ledger Entries
      // Entry 1: DEBIT - Rider Account
      const debitEntry = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${idempotencyKey}_dr_rider`,
        accountId: `RIDER_ACCOUNT_${effectiveRiderId}`,
        entryType: 'DEBIT',
        amountPaise: Number(plan.pricePaise),
        currency: 'INR',
        description: `Commuter pass purchase ${passNumber} (${plan.name})`,
      });

      // Entry 2: CREDIT - Advance Pass Escrow Liability
      const creditEntry = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${idempotencyKey}_cr_escrow`,
        accountId: 'ADVANCE_PASS_ESCROW_LIABILITY',
        entryType: 'CREDIT',
        amountPaise: Number(plan.pricePaise),
        currency: 'INR',
        description: `Advance pass escrow trust liability for ${passNumber}`,
      });

      await manager.save([debitEntry, creditEntry]);
    });

    this.logger.log(
      `[CommuterPassesService] Issued commuter pass ${passNumber} to rider ${effectiveRiderId}: ₹${(Number(plan.pricePaise) / 100).toFixed(2)}`,
    );

    return this.toPassDto(pass, plan.name);
  }

  /**
   * EV-101: Redeem a ride on an active commuter pass.
   */
  async redeemPass(
    _actor: CurrentActorPayload | undefined,
    dto: RedeemPassDto,
  ): Promise<RedeemPassResponse> {
    const idempotencyKey =
      dto.idempotencyKey || `pass_red_${dto.passId}_${Date.now()}`;

    // Replay check
    const existing = await this.redemptionRepo.findOne({
      where: { idempotencyKey },
    });
    if (existing) {
      const pass = await this.passRepo.findOne({ where: { id: dto.passId } });
      return {
        redemptionId: existing.id,
        passId: existing.passId,
        ridesRemaining: pass?.ridesRemaining || 0,
        status: (pass?.status as CommuterPassStatus) || CommuterPassStatus.ACTIVE,
        redeemedAt: existing.createdAt.toISOString(),
      };
    }

    return await this.dataSource.transaction(async (manager: EntityManager) => {
      const pass = await manager
        .createQueryBuilder(CommuterPass, 'p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id: dto.passId })
        .getOne();

      if (!pass) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Commuter pass '${dto.passId}' not found.`,
        });
      }

      if (pass.status !== CommuterPassStatus.ACTIVE) {
        throw new ConflictException({
          code: ApiErrorCode.CONFLICT,
          message: `Cannot redeem pass with status '${pass.status}'. Pass must be ACTIVE.`,
        });
      }

      const now = new Date();
      if (now > pass.validUntil) {
        pass.status = CommuterPassStatus.EXPIRED;
        await manager.save(pass);
        throw new ConflictException({
          code: ApiErrorCode.CONFLICT,
          message: 'Commuter pass has expired.',
        });
      }

      if (pass.ridesRemaining <= 0) {
        pass.status = CommuterPassStatus.EXHAUSTED;
        await manager.save(pass);
        throw new ConflictException({
          code: ApiErrorCode.CONFLICT,
          message: 'Commuter pass ride allocation is fully exhausted.',
        });
      }

      pass.ridesRemaining -= 1;
      if (pass.ridesRemaining === 0) {
        pass.status = CommuterPassStatus.EXHAUSTED;
      }
      await manager.save(pass);

      const redemption = manager.create(PassRedemption, {
        id: randomUUID(),
        passId: pass.id,
        bookingId: dto.bookingId,
        tripId: dto.tripId,
        idempotencyKey,
      });
      await manager.save(redemption);

      // Earned revenue recognition from escrow liability
      const unitFarePaise = Math.round(Number(pass.pricePaise) / Number(pass.totalRides));

      const debitEscrow = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${idempotencyKey}_dr_escrow`,
        accountId: 'ADVANCE_PASS_ESCROW_LIABILITY',
        entryType: 'DEBIT',
        amountPaise: unitFarePaise,
        currency: 'INR',
        description: `Pass redemption for ${pass.passNumber}`,
      });

      const creditRevenue = manager.create(LedgerEntry, {
        id: randomUUID(),
        idempotencyKey: `${idempotencyKey}_cr_rev`,
        accountId: 'EARNED_PASS_TRANSPORT_REVENUE',
        entryType: 'CREDIT',
        amountPaise: unitFarePaise,
        currency: 'INR',
        description: `Earned ride revenue from pass ${pass.passNumber}`,
      });

      await manager.save([debitEscrow, creditRevenue]);

      this.logger.log(
        `[CommuterPassesService] Redeemed 1 ride on pass ${pass.passNumber}. Remaining: ${pass.ridesRemaining}`,
      );

      return {
        redemptionId: redemption.id,
        passId: pass.id,
        ridesRemaining: pass.ridesRemaining,
        status: pass.status as CommuterPassStatus,
        redeemedAt: now.toISOString(),
      };
    });
  }

  /**
   * EV-109: Apply SLA Punctuality Delay Compensation.
   * Disburses automated delay credits to all passenger wallets on a delayed trip.
   */
  async applySlaDelayCompensation(
    actor: CurrentActorPayload | undefined,
    dto: SlaDelayCompensationDto,
  ): Promise<SlaCompensationResponse> {
    const actorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const isPrivileged = ['ADMIN', 'OPERATOR', 'SAFETY_OFFICER', 'SYSTEM'].includes(actorRole);

    if (!isPrivileged) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'Access denied: Only operators or admins can trigger SLA compensation.',
      });
    }

    if (dto.delayMinutes < 15) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'SLA delay compensation requires delay of at least 15 minutes.',
      });
    }

    const reservations = await this.reservationRepo.find({
      where: { tripId: dto.tripId },
    });

    if (reservations.length === 0) {
      return {
        tripId: dto.tripId,
        delayMinutes: dto.delayMinutes,
        compensatedPassengersCount: 0,
        totalCompensationPaise: 0,
        formattedTotal: '₹0.00',
        processedAt: new Date().toISOString(),
      };
    }

    const compensationPerRiderPaise = dto.compensationPaise || 5000; // ₹50.00 default credit
    let totalPaidPaise = 0;

    await this.dataSource.transaction(async (manager: EntityManager) => {
      for (const res of reservations) {
        const idempotencyKey = `sla_comp_${dto.tripId}_${res.riderId}`;

        // Entry 1: DEBIT - Platform SLA Penalty Expense
        const debitExpense = manager.create(LedgerEntry, {
          id: randomUUID(),
          idempotencyKey: `${idempotencyKey}_dr_exp`,
          accountId: 'PLATFORM_SLA_PENALTY_EXPENSE',
          entryType: 'DEBIT',
          amountPaise: compensationPerRiderPaise,
          currency: 'INR',
          description: `SLA delay compensation for ${dto.delayMinutes}m delay (Reason: ${dto.reason})`,
        });

        // Entry 2: CREDIT - Rider Wallet
        const creditRider = manager.create(LedgerEntry, {
          id: randomUUID(),
          idempotencyKey: `${idempotencyKey}_cr_rider`,
          accountId: `RIDER_ACCOUNT_${res.riderId}`,
          entryType: 'CREDIT',
          amountPaise: compensationPerRiderPaise,
          currency: 'INR',
          description: `SLA delay compensation credit for trip ${dto.tripId}`,
        });

        await manager.save([debitExpense, creditRider]);
        totalPaidPaise += compensationPerRiderPaise;
      }
    });

    this.logger.log(
      `[CommuterPassesService] Distributed SLA delay compensation for trip ${dto.tripId}: ${reservations.length} riders, ₹${(totalPaidPaise / 100).toFixed(2)}`,
    );

    return {
      tripId: dto.tripId,
      delayMinutes: dto.delayMinutes,
      compensatedPassengersCount: reservations.length,
      totalCompensationPaise: totalPaidPaise,
      formattedTotal: `₹${(totalPaidPaise / 100).toFixed(2)}`,
      processedAt: new Date().toISOString(),
    };
  }

  private toPlanDto(plan: PassPlan): PassPlanDto {
    const pricePaise = Number(plan.pricePaise);
    return {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      city: plan.city,
      passType: plan.passType as any,
      pricePaise,
      formattedPrice: `₹${(pricePaise / 100).toFixed(2)}`,
      validityDays: plan.validityDays,
      rideLimit: plan.rideLimit,
      isActive: plan.isActive,
    };
  }

  private toPassDto(pass: CommuterPass, planName: string): CommuterPassDto {
    const pricePaise = Number(pass.pricePaise);
    return {
      id: pass.id,
      passNumber: pass.passNumber,
      riderId: pass.riderId,
      planId: pass.planId,
      planName,
      passType: 'CORRIDOR_COMMUTE' as any,
      status: pass.status as CommuterPassStatus,
      validFrom: pass.validFrom.toISOString(),
      validUntil: pass.validUntil.toISOString(),
      totalRidesAllocated: pass.totalRides,
      ridesRemaining: pass.ridesRemaining,
      purchasedPricePaise: pricePaise,
      formattedPrice: `₹${(pricePaise / 100).toFixed(2)}`,
      createdAt: pass.createdAt.toISOString(),
    };
  }
}
