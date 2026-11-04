import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { PayoutBatch } from '../../database/entities/payout-batch.entity';
import { PayoutItem } from '../../database/entities/payout-item.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { Booking } from '../../database/entities/booking.entity';
import { DriverProfile } from '../../database/entities/driver-profile.entity';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  PayoutBatchStatus,
  PayoutItemStatus,
  SettlementRecipientType,
  CaptainEarningsSummaryDto,
  CreatePayoutBatchDto,
  ApprovePayoutBatchDto,
  PayoutBatchDto,
  PayoutItemDto,
  ApiErrorCode,
  RideStatus,
} from '@ecoride/contracts';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    @InjectRepository(PayoutBatch)
    private readonly batchRepo: Repository<PayoutBatch>,
    @InjectRepository(PayoutItem)
    private readonly itemRepo: Repository<PayoutItem>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepo: Repository<LedgerEntry>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepo: Repository<DriverProfile>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * EV-055: Aggregate Captain Earnings & Wallet Balance from Ledger Entries.
   * Offsets physical cash collected in hand and retains escrow reserve.
   */
  async getCaptainEarningsSummary(captainId: string): Promise<CaptainEarningsSummaryDto> {
    const walletAccountId = `CAPTAIN_WALLET_${captainId}`;
    const cashAccountId = `CAPTAIN_CASH_IN_HAND_${captainId}`;

    const walletEntries = await this.ledgerRepo.find({
      where: { accountId: walletAccountId },
      order: { createdAt: 'DESC' },
    });

    const cashEntries = await this.ledgerRepo.find({
      where: { accountId: cashAccountId },
      order: { createdAt: 'DESC' },
    });

    let grossEarningsPaise = 0;
    let previousDisbursalsPaise = 0;

    for (const entry of walletEntries) {
      if (entry.entryType === 'CREDIT') {
        grossEarningsPaise += Number(entry.amountPaise);
      } else if (entry.entryType === 'DEBIT') {
        previousDisbursalsPaise += Number(entry.amountPaise);
      }
    }

    let cashCollectedOffsetPaise = 0;
    for (const entry of cashEntries) {
      if (entry.entryType === 'DEBIT') {
        cashCollectedOffsetPaise += Number(entry.amountPaise);
      } else if (entry.entryType === 'CREDIT') {
        cashCollectedOffsetPaise -= Number(entry.amountPaise);
      }
    }
    cashCollectedOffsetPaise = Math.max(0, cashCollectedOffsetPaise);

    // Escrow reserve retention: ₹100.00 (10000 paise) minimum holdback
    const escrowReservePaise = 10000;

    const netPayablePaise = Math.max(
      0,
      grossEarningsPaise - previousDisbursalsPaise - cashCollectedOffsetPaise - escrowReservePaise,
    );

    const completedTripsCount = await this.bookingRepo.count({
      where: { captainId, status: RideStatus.COMPLETED },
    });

    return {
      captainId,
      currency: 'INR',
      grossEarningsPaise,
      cashCollectedOffsetPaise,
      previousDisbursalsPaise,
      escrowReservePaise,
      netPayablePaise,
      formattedNetPayable: `₹${(netPayablePaise / 100).toFixed(2)}`,
      totalTripsCompleted: completedTripsCount,
      recentLedgerEntries: walletEntries.slice(0, 10).map((e) => ({
        id: e.id,
        entryType: e.entryType,
        amountPaise: Number(e.amountPaise),
        description: e.description,
        createdAt: e.createdAt.toISOString(),
      })),
    };
  }

  /**
   * EV-056: Propose Weekly or On-Demand Payout Batch.
   */
  async createPayoutBatch(
    actor: CurrentActorPayload | undefined,
    dto: CreatePayoutBatchDto,
  ): Promise<PayoutBatchDto> {
    const actorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const isPrivileged = ['ADMIN', 'OPERATOR', 'FINANCE', 'SYSTEM'].includes(actorRole);

    if (!isPrivileged) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'Access denied: Only finance officers or platform admins can propose payout batches.',
      });
    }

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Invalid periodStart or periodEnd date format.',
      });
    }

    if (periodEnd <= periodStart) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'periodEnd must be after periodStart.',
      });
    }

    const thresholdPaise = dto.minimumPayoutThresholdPaise ?? 50000; // ₹500 default
    const escrowReservePaise = dto.escrowReservePaise ?? 10000; // ₹100 default

    const activeDrivers = await this.driverProfileRepo.find();
    const itemsToCreate: Partial<PayoutItem>[] = [];
    let totalDisbursalPaise = 0;

    const year = periodEnd.getFullYear();
    const batchNumber = `PAYOUT-AP-${year}-B${Date.now().toString().slice(-6)}`;

    const batch = this.batchRepo.create({
      batchNumber,
      status: PayoutBatchStatus.PROPOSED,
      periodStart,
      periodEnd,
      notes: dto.notes,
      totalDisbursalPaise: 0,
      totalItemsCount: 0,
    });

    const savedBatch = await this.batchRepo.save(batch);

    for (const driver of activeDrivers) {
      const summary = await this.getCaptainEarningsSummary(driver.userId);
      if (summary.netPayablePaise >= thresholdPaise) {
        const item = this.itemRepo.create({
          batchId: savedBatch.id,
          recipientType: SettlementRecipientType.CAPTAIN,
          recipientId: driver.userId,
          payoutAccountId: `AP_BANK_ACC_${driver.userId.substring(0, 8).toUpperCase()}`,
          grossEarningsPaise: summary.grossEarningsPaise,
          cashCollectedOffsetPaise: summary.cashCollectedOffsetPaise,
          netDisbursalPaise: summary.netPayablePaise,
          escrowReservePaise,
          status: PayoutItemStatus.PENDING,
          idempotencyKey: `pout_item_${savedBatch.id}_${driver.userId}`,
        });
        itemsToCreate.push(item);
        totalDisbursalPaise += summary.netPayablePaise;
      }
    }

    let savedItems: PayoutItem[] = [];
    if (itemsToCreate.length > 0) {
      savedItems = await this.itemRepo.save(itemsToCreate as PayoutItem[]);
    }

    savedBatch.totalDisbursalPaise = totalDisbursalPaise;
    savedBatch.totalItemsCount = savedItems.length;
    await this.batchRepo.save(savedBatch);

    this.logger.log(
      `[SettlementService] Created proposed payout batch ${savedBatch.batchNumber}: ${savedItems.length} items, Total: ₹${(totalDisbursalPaise / 100).toFixed(2)}`,
    );

    return this.toBatchDto(savedBatch, savedItems);
  }

  /**
   * EV-056: Approve Proposed Payout Batch.
   */
  async approvePayoutBatch(
    batchId: string,
    actor: CurrentActorPayload | undefined,
    dto?: ApprovePayoutBatchDto,
  ): Promise<PayoutBatchDto> {
    const actorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const isPrivileged = ['ADMIN', 'FINANCE', 'SYSTEM'].includes(actorRole);

    if (!isPrivileged) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'Access denied: Only finance officers or admins can approve payout batches.',
      });
    }

    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Payout batch '${batchId}' not found.`,
      });
    }

    if (batch.status !== PayoutBatchStatus.PROPOSED) {
      throw new BadRequestException({
        code: ApiErrorCode.CONFLICT,
        message: `Cannot approve payout batch in status '${batch.status}'. Must be in '${PayoutBatchStatus.PROPOSED}'.`,
      });
    }

    batch.status = PayoutBatchStatus.APPROVED;
    batch.approvedById = actor?.id;
    batch.approvedAt = new Date();
    if (dto?.notes) {
      batch.notes = (batch.notes ? `${batch.notes}; ` : '') + dto.notes;
    }

    await this.batchRepo.save(batch);
    const items = await this.itemRepo.find({ where: { batchId: batch.id } });

    this.logger.log(
      `[SettlementService] Approved payout batch ${batch.batchNumber} by actor ${actor?.id || 'SYSTEM'}`,
    );

    return this.toBatchDto(batch, items);
  }

  /**
   * EV-056: Execute Approved Payout Batch.
   * Posts double-entry ledger debits/credits and simulates gateway disbursal.
   */
  async executePayoutBatch(
    batchId: string,
    actor: CurrentActorPayload | undefined,
  ): Promise<PayoutBatchDto> {
    const actorRole = (actor?.role || 'ANONYMOUS').toUpperCase();
    const isPrivileged = ['ADMIN', 'FINANCE', 'SYSTEM'].includes(actorRole);

    if (!isPrivileged) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'Access denied: Only finance officers or admins can execute payout batches.',
      });
    }

    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Payout batch '${batchId}' not found.`,
      });
    }

    if (batch.status !== PayoutBatchStatus.APPROVED) {
      throw new BadRequestException({
        code: ApiErrorCode.CONFLICT,
        message: `Cannot execute payout batch in status '${batch.status}'. Must be in '${PayoutBatchStatus.APPROVED}'.`,
      });
    }

    const items = await this.itemRepo.find({ where: { batchId: batch.id } });

    await this.dataSource.transaction(async (manager: EntityManager) => {
      batch.status = PayoutBatchStatus.PROCESSING;
      await manager.save(batch);

      for (const item of items) {
        if (item.status === PayoutItemStatus.DISBURSED) {
          continue;
        }

        const disbursalAmount = Number(item.netDisbursalPaise);
        const cashOffset = Number(item.cashCollectedOffsetPaise);

        // Simulated RazorpayX / IMPS gateway payout ID
        const gatewayPayoutId = `pout_ap_imps_${randomUUID().replace(/-/g, '').substring(0, 14)}`;

        // Immutable Double-Entry Ledger Entries for Disbursal
        // Entry 1: DEBIT - Captain Wallet (reducing platform liability to captain)
        const debitWallet = manager.create(LedgerEntry, {
          id: randomUUID(),
          idempotencyKey: `pout_ledger_${item.id}_dr_wallet`,
          accountId: `CAPTAIN_WALLET_${item.recipientId}`,
          entryType: 'DEBIT',
          amountPaise: disbursalAmount,
          currency: 'INR',
          description: `Bank disbursal for batch ${batch.batchNumber} (GatewayId: ${gatewayPayoutId})`,
        });

        // Entry 2: CREDIT - Bank Escrow Disbursal Clearing
        const creditBank = manager.create(LedgerEntry, {
          id: randomUUID(),
          idempotencyKey: `pout_ledger_${item.id}_cr_bank`,
          accountId: 'BANK_ESCROW_DISBURSAL',
          entryType: 'CREDIT',
          amountPaise: disbursalAmount,
          currency: 'INR',
          description: `Bank IMPS transfer to ${item.payoutAccountId}`,
        });

        await manager.save([debitWallet, creditBank]);

        // If physical cash was offset against this disbursal, clear cash liability
        if (cashOffset > 0) {
          const debitCashOffset = manager.create(LedgerEntry, {
            id: randomUUID(),
            idempotencyKey: `pout_cash_off_${item.id}_dr_wallet`,
            accountId: `CAPTAIN_WALLET_${item.recipientId}`,
            entryType: 'DEBIT',
            amountPaise: cashOffset,
            currency: 'INR',
            description: `Cash in hand liability offset for batch ${batch.batchNumber}`,
          });

          const creditCashOffset = manager.create(LedgerEntry, {
            id: randomUUID(),
            idempotencyKey: `pout_cash_off_${item.id}_cr_cash_acc`,
            accountId: `CAPTAIN_CASH_IN_HAND_${item.recipientId}`,
            entryType: 'CREDIT',
            amountPaise: cashOffset,
            currency: 'INR',
            description: `Cash collection liability cleared in settlement`,
          });

          await manager.save([debitCashOffset, creditCashOffset]);
        }

        item.status = PayoutItemStatus.DISBURSED;
        item.gatewayPayoutId = gatewayPayoutId;
        await manager.save(item);
      }

      batch.status = PayoutBatchStatus.COMPLETED;
      await manager.save(batch);
    });

    this.logger.log(
      `[SettlementService] Successfully executed payout batch ${batch.batchNumber}: ${items.length} disbursals completed.`,
    );

    return this.toBatchDto(batch, items);
  }

  /**
   * Retrieves single payout batch with its associated items.
   */
  async getPayoutBatch(batchId: string): Promise<PayoutBatchDto> {
    const batch = await this.batchRepo.findOne({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Payout batch '${batchId}' not found.`,
      });
    }

    const items = await this.itemRepo.find({
      where: { batchId },
      order: { netDisbursalPaise: 'DESC' },
    });

    return this.toBatchDto(batch, items);
  }

  /**
   * Lists recent payout batches.
   */
  async listPayoutBatches(limit = 20): Promise<PayoutBatchDto[]> {
    const batches = await this.batchRepo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return batches.map((b) => this.toBatchDto(b));
  }

  private toBatchDto(batch: PayoutBatch, items?: PayoutItem[]): PayoutBatchDto {
    const totalPaise = Number(batch.totalDisbursalPaise);
    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      status: batch.status as PayoutBatchStatus,
      totalDisbursalPaise: totalPaise,
      formattedTotal: `₹${(totalPaise / 100).toFixed(2)}`,
      totalItemsCount: batch.totalItemsCount,
      periodStart: batch.periodStart.toISOString(),
      periodEnd: batch.periodEnd.toISOString(),
      approvedById: batch.approvedById,
      approvedAt: batch.approvedAt ? batch.approvedAt.toISOString() : undefined,
      notes: batch.notes,
      items: items ? items.map((i) => this.toItemDto(i)) : undefined,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }

  private toItemDto(item: PayoutItem): PayoutItemDto {
    const netPaise = Number(item.netDisbursalPaise);
    return {
      id: item.id,
      batchId: item.batchId,
      recipientType: item.recipientType as SettlementRecipientType,
      recipientId: item.recipientId,
      payoutAccountId: item.payoutAccountId,
      grossEarningsPaise: Number(item.grossEarningsPaise),
      cashCollectedOffsetPaise: Number(item.cashCollectedOffsetPaise),
      netDisbursalPaise: netPaise,
      formattedNetDisbursal: `₹${(netPaise / 100).toFixed(2)}`,
      escrowReservePaise: Number(item.escrowReservePaise),
      status: item.status as PayoutItemStatus,
      gatewayPayoutId: item.gatewayPayoutId,
      idempotencyKey: item.idempotencyKey,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
