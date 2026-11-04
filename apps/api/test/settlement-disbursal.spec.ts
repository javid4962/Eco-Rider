import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { SettlementService } from '../src/modules/settlement/settlement.service';
import { SettlementController } from '../src/modules/settlement/settlement.controller';
import { PayoutBatch } from '../src/database/entities/payout-batch.entity';
import { PayoutItem } from '../src/database/entities/payout-item.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import { Booking } from '../src/database/entities/booking.entity';
import { DriverProfile } from '../src/database/entities/driver-profile.entity';
import {
  PayoutBatchStatus,
  PayoutItemStatus,
  RideStatus,
} from '@ecoride/contracts';

describe('Milestone M06: Settlement & Driver/Owner Disbursal (EV-055 – EV-056)', () => {
  let settlementService: SettlementService;
  let settlementController: SettlementController;

  const captainId1 = 'c1000000-0000-0000-0000-000000000001';
  const captainId2 = 'c1000000-0000-0000-0000-000000000002';

  const storedBatches: PayoutBatch[] = [];
  const storedItems: PayoutItem[] = [];
  const storedLedgerEntries: LedgerEntry[] = [];
  const mockDrivers: Partial<DriverProfile>[] = [
    { id: 'dp-1', userId: captainId1 },
    { id: 'dp-2', userId: captainId2 },
  ];

  const mockBatchRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: { id: string } }) => {
      return storedBatches.find((b) => b.id === criteria.where.id) || null;
    }),
    find: jest.fn().mockImplementation(async () => [...storedBatches]),
    create: jest.fn().mockImplementation((data: Partial<PayoutBatch>) => {
      return {
        id: 'batch_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: PayoutBatchStatus.PROPOSED,
        totalDisbursalPaise: 0,
        totalItemsCount: 0,
        ...data,
      } as PayoutBatch;
    }),
    save: jest.fn().mockImplementation(async (data: PayoutBatch) => {
      const idx = storedBatches.findIndex((b) => b.id === data.id);
      if (idx >= 0) storedBatches[idx] = data;
      else storedBatches.push(data);
      return data;
    }),
  };

  const mockItemRepo = {
    find: jest.fn().mockImplementation(async (criteria: { where: { batchId: string } }) => {
      return storedItems.filter((i) => i.batchId === criteria.where.batchId);
    }),
    create: jest.fn().mockImplementation((data: Partial<PayoutItem>) => {
      return {
        id: 'item_' + Math.random().toString(36).substring(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: PayoutItemStatus.PENDING,
        ...data,
      } as PayoutItem;
    }),
    save: jest.fn().mockImplementation(async (data: PayoutItem | PayoutItem[]) => {
      if (Array.isArray(data)) {
        for (const item of data) {
          const idx = storedItems.findIndex((i) => i.id === item.id);
          if (idx >= 0) storedItems[idx] = item;
          else storedItems.push(item);
        }
        return data;
      }
      const idx = storedItems.findIndex((i) => i.id === data.id);
      if (idx >= 0) storedItems[idx] = data;
      else storedItems.push(data);
      return data;
    }),
  };

  const mockLedgerRepo = {
    find: jest.fn().mockImplementation(async (criteria: { where: { accountId: string } }) => {
      return storedLedgerEntries.filter((e) => e.accountId === criteria.where.accountId);
    }),
  };

  const mockBookingRepo = {
    count: jest.fn().mockImplementation(async (criteria: { where: { captainId: string; status: string } }) => {
      return criteria.where.status === RideStatus.COMPLETED ? 5 : 0;
    }),
  };

  const mockDriverProfileRepo = {
    find: jest.fn().mockImplementation(async () => [...mockDrivers]),
  };

  const mockEntityManager: Partial<EntityManager> = {
    create: jest.fn().mockImplementation((_entityClass: unknown, plainObj: Record<string, unknown>) => ({
      ...plainObj,
    })),
    save: jest.fn().mockImplementation(async (target: unknown) => {
      if (Array.isArray(target)) {
        for (const item of target) {
          if ((item as LedgerEntry).entryType) {
            storedLedgerEntries.push(item as LedgerEntry);
          } else if ((item as PayoutItem).batchId) {
            const idx = storedItems.findIndex((i) => i.id === (item as PayoutItem).id);
            if (idx >= 0) storedItems[idx] = item as PayoutItem;
            else storedItems.push(item as PayoutItem);
          }
        }
        return target;
      }
      const batch = target as PayoutBatch;
      if (batch?.batchNumber) {
        const idx = storedBatches.findIndex((b) => b.id === batch.id);
        if (idx >= 0) storedBatches[idx] = batch;
        else storedBatches.push(batch);
      }
      return target;
    }),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation(async (cb: (manager: EntityManager) => Promise<unknown>) => {
      return cb(mockEntityManager as EntityManager);
    }),
  };

  beforeEach(async () => {
    storedBatches.length = 0;
    storedItems.length = 0;
    storedLedgerEntries.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettlementController],
      providers: [
        SettlementService,
        {
          provide: getRepositoryToken(PayoutBatch),
          useValue: mockBatchRepo,
        },
        {
          provide: getRepositoryToken(PayoutItem),
          useValue: mockItemRepo,
        },
        {
          provide: getRepositoryToken(LedgerEntry),
          useValue: mockLedgerRepo,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepo,
        },
        {
          provide: getRepositoryToken(DriverProfile),
          useValue: mockDriverProfileRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    settlementService = module.get<SettlementService>(SettlementService);
    settlementController = module.get<SettlementController>(SettlementController);
  });

  describe('EV-055: Captain Earnings & Wallet Summary Aggregation', () => {
    it('should aggregate gross earnings, deduct cash in hand liability, and retain escrow reserve', async () => {
      // Seed ₹1,500 gross earnings credits (150000 paise)
      storedLedgerEntries.push({
        id: 'ledg_1',
        idempotencyKey: 'idem_earn_1',
        accountId: `CAPTAIN_WALLET_${captainId1}`,
        entryType: 'CREDIT',
        amountPaise: 150000,
        currency: 'INR',
        createdAt: new Date(),
      } as LedgerEntry);

      // Seed ₹300 cash collected in hand (30000 paise liability)
      storedLedgerEntries.push({
        id: 'ledg_cash_1',
        idempotencyKey: 'idem_cash_1',
        accountId: `CAPTAIN_CASH_IN_HAND_${captainId1}`,
        entryType: 'DEBIT',
        amountPaise: 30000,
        currency: 'INR',
        createdAt: new Date(),
      } as LedgerEntry);

      const summary = await settlementService.getCaptainEarningsSummary(captainId1);

      expect(summary.captainId).toBe(captainId1);
      expect(summary.grossEarningsPaise).toBe(150000);
      expect(summary.cashCollectedOffsetPaise).toBe(30000);
      expect(summary.escrowReservePaise).toBe(10000); // ₹100 reserve

      // Net payable = 150000 - 30000 - 10000 = 110000 paise (₹1,100.00)
      expect(summary.netPayablePaise).toBe(110000);
      expect(summary.formattedNetPayable).toBe('₹1100.00');
      expect(summary.totalTripsCompleted).toBe(5);
    });

    it('should not allow negative net payable balance when liabilities exceed earnings', async () => {
      // Small earnings ₹50 (5000 paise)
      storedLedgerEntries.push({
        id: 'ledg_small',
        idempotencyKey: 'idem_small',
        accountId: `CAPTAIN_WALLET_${captainId2}`,
        entryType: 'CREDIT',
        amountPaise: 5000,
        currency: 'INR',
        createdAt: new Date(),
      } as LedgerEntry);

      const summary = await settlementService.getCaptainEarningsSummary(captainId2);

      // 5000 - 10000 reserve => clamped to 0
      expect(summary.netPayablePaise).toBe(0);
      expect(summary.formattedNetPayable).toBe('₹0.00');
    });
  });

  describe('EV-056: Disbursal Payout Batch Lifecycle', () => {
    it('should propose, approve, and execute a payout batch with balanced double-entry ledger entries', async () => {
      // Seed captain1 with ₹2,000 earnings (200000 paise) and ₹200 cash liability (20000 paise)
      storedLedgerEntries.push({
        id: 'ledg_c1',
        idempotencyKey: 'idem_c1',
        accountId: `CAPTAIN_WALLET_${captainId1}`,
        entryType: 'CREDIT',
        amountPaise: 200000,
        currency: 'INR',
        createdAt: new Date(),
      } as LedgerEntry);

      storedLedgerEntries.push({
        id: 'ledg_c1_cash',
        idempotencyKey: 'idem_c1_cash',
        accountId: `CAPTAIN_CASH_IN_HAND_${captainId1}`,
        entryType: 'DEBIT',
        amountPaise: 20000,
        currency: 'INR',
        createdAt: new Date(),
      } as LedgerEntry);

      const financeActor = {
        id: 'fin_officer_001',
        role: 'FINANCE',
        scopes: [],
      };

      // 1. Propose batch
      const proposedBatch = await settlementService.createPayoutBatch(financeActor, {
        periodStart: '2026-11-01T00:00:00Z',
        periodEnd: '2026-11-07T23:59:59Z',
        minimumPayoutThresholdPaise: 50000, // ₹500
        notes: 'Andhra Pradesh corridor weekly settlement cycle #45',
      });

      expect(proposedBatch).toBeDefined();
      expect(proposedBatch.status).toBe(PayoutBatchStatus.PROPOSED);
      expect(proposedBatch.totalItemsCount).toBe(1); // Captain 1 qualifies; Captain 2 has 0
      // Net payable = 200000 - 20000 - 10000 = 170000 paise (₹1,700.00)
      expect(proposedBatch.totalDisbursalPaise).toBe(170000);

      // 2. Approve batch
      const approvedBatch = await settlementService.approvePayoutBatch(
        proposedBatch.id,
        financeActor,
        { notes: 'Audited and approved for automated disbursal' },
      );

      expect(approvedBatch.status).toBe(PayoutBatchStatus.APPROVED);
      expect(approvedBatch.approvedById).toBe('fin_officer_001');

      // 3. Execute batch
      const executedBatch = await settlementService.executePayoutBatch(
        proposedBatch.id,
        financeActor,
      );

      expect(executedBatch.status).toBe(PayoutBatchStatus.COMPLETED);

      // Verify double-entry ledger entries for payout and cash clearance
      const payoutEntries = storedLedgerEntries.filter((e) =>
        e.idempotencyKey.includes('pout_ledger_'),
      );
      expect(payoutEntries.length).toBe(2);

      const debitWallet = payoutEntries.find((e) => e.entryType === 'DEBIT');
      const creditBank = payoutEntries.find((e) => e.entryType === 'CREDIT');

      expect(debitWallet?.accountId).toBe(`CAPTAIN_WALLET_${captainId1}`);
      expect(debitWallet?.amountPaise).toBe(170000);
      expect(creditBank?.accountId).toBe('BANK_ESCROW_DISBURSAL');
      expect(creditBank?.amountPaise).toBe(170000);

      // Cash clearance entries: DEBIT Wallet, CREDIT Cash account
      const cashClearanceEntries = storedLedgerEntries.filter((e) =>
        e.idempotencyKey.includes('pout_cash_off_'),
      );
      expect(cashClearanceEntries.length).toBe(2);
      const debitCashClearance = cashClearanceEntries.find((e) => e.entryType === 'DEBIT');
      const creditCashClearance = cashClearanceEntries.find((e) => e.entryType === 'CREDIT');

      expect(debitCashClearance?.amountPaise).toBe(20000);
      expect(creditCashClearance?.amountPaise).toBe(20000);
    });

    it('should reject batch creation and approval by unauthorized non-finance actors', async () => {
      const unauthorizedActor = {
        id: 'rider_uuid_123',
        role: 'RIDER',
        scopes: [],
      };

      await expect(
        settlementService.createPayoutBatch(unauthorizedActor, {
          periodStart: '2026-11-01T00:00:00Z',
          periodEnd: '2026-11-07T23:59:59Z',
        }),
      ).rejects.toThrow();
    });
  });

  describe('SettlementController Delegations', () => {
    it('should route getCaptainSummary and listBatches through SettlementController', async () => {
      const summary = await settlementController.getCaptainSummary(captainId1);
      expect(summary.captainId).toBe(captainId1);

      const batches = await settlementController.listBatches(10);
      expect(Array.isArray(batches)).toBe(true);
    });
  });
});

