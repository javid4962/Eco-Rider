import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { CommuterPassesService } from '../src/modules/commuter-passes/commuter-passes.service';
import { CommuterPassesController } from '../src/modules/commuter-passes/commuter-passes.controller';
import { PassPlan } from '../src/database/entities/pass-plan.entity';
import { CommuterPass } from '../src/database/entities/commuter-pass.entity';
import { PassRedemption } from '../src/database/entities/pass-redemption.entity';
import { CorridorSeatReservation } from '../src/database/entities/corridor-seat-reservation.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import {
  CommuterPassType,
  CommuterPassStatus,
} from '@ecoride/contracts';

describe('Milestones M12 & M13: Commuter Passes & Guarantees (EV-098 – EV-109)', () => {
  let passesService: CommuterPassesService;
  let passesController: CommuterPassesController;

  const storedPlans: PassPlan[] = [];
  const storedPasses: CommuterPass[] = [];
  const storedRedemptions: PassRedemption[] = [];
  const storedReservations: CorridorSeatReservation[] = [];
  const storedLedgerEntries: LedgerEntry[] = [];

  const mockPlanRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedPlans.find((p) => {
        for (const k of Object.keys(where)) {
          if ((p as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async () => [...storedPlans]),
    create: jest.fn().mockImplementation((data: Partial<PassPlan>) => {
      return {
        id: 'plan_' + Math.random().toString(36).substring(2, 9),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as PassPlan;
    }),
    save: jest.fn().mockImplementation(async (data: PassPlan) => {
      const idx = storedPlans.findIndex((p) => p.id === data.id);
      if (idx >= 0) storedPlans[idx] = data;
      else storedPlans.push(data);
      return data;
    }),
  };

  const mockPassRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedPasses.find((p) => {
        for (const k of Object.keys(where)) {
          if ((p as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    find: jest.fn().mockImplementation(async () => [...storedPasses]),
    create: jest.fn().mockImplementation((data: Partial<CommuterPass>) => {
      return {
        id: 'pass_' + Math.random().toString(36).substring(2, 9),
        status: CommuterPassStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data,
      } as CommuterPass;
    }),
    save: jest.fn().mockImplementation(async (data: CommuterPass) => {
      const idx = storedPasses.findIndex((p) => p.id === data.id);
      if (idx >= 0) storedPasses[idx] = data;
      else storedPasses.push(data);
      return data;
    }),
  };

  const mockRedemptionRepo = {
    findOne: jest.fn().mockImplementation(async (criteria: { where: Record<string, unknown> }) => {
      const where = criteria.where;
      return storedRedemptions.find((r) => {
        for (const k of Object.keys(where)) {
          if ((r as unknown as Record<string, unknown>)[k] !== where[k]) return false;
        }
        return true;
      }) || null;
    }),
    save: jest.fn().mockImplementation(async (data: PassRedemption) => {
      storedRedemptions.push(data);
      return data;
    }),
  };

  const mockReservationRepo = {
    find: jest.fn().mockImplementation(async (criteria: { where: { tripId: string } }) => {
      return storedReservations.filter((r) => r.tripId === criteria.where.tripId);
    }),
  };

  const mockEntityManager: Partial<EntityManager> = {
    createQueryBuilder: jest.fn().mockImplementation(() => ({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockImplementation(async () => storedPasses[0] || null),
    })),
    create: jest.fn().mockImplementation((_entityClass: unknown, plainObj: Record<string, unknown>) => ({
      ...plainObj,
    })),
    save: jest.fn().mockImplementation(async (target: unknown) => {
      if (Array.isArray(target)) {
        for (const item of target) {
          if ((item as LedgerEntry).entryType) {
            storedLedgerEntries.push(item as LedgerEntry);
          }
        }
        return target;
      }
      const pass = target as CommuterPass;
      if (pass?.passNumber) {
        const idx = storedPasses.findIndex((p) => p.id === pass.id);
        if (idx >= 0) storedPasses[idx] = pass;
        else storedPasses.push(pass);
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
    storedPlans.length = 0;
    storedPasses.length = 0;
    storedRedemptions.length = 0;
    storedReservations.length = 0;
    storedLedgerEntries.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommuterPassesController],
      providers: [
        CommuterPassesService,
        {
          provide: getRepositoryToken(PassPlan),
          useValue: mockPlanRepo,
        },
        {
          provide: getRepositoryToken(CommuterPass),
          useValue: mockPassRepo,
        },
        {
          provide: getRepositoryToken(PassRedemption),
          useValue: mockRedemptionRepo,
        },
        {
          provide: getRepositoryToken(CorridorSeatReservation),
          useValue: mockReservationRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    passesService = module.get<CommuterPassesService>(CommuterPassesService);
    passesController = module.get<CommuterPassesController>(CommuterPassesController);
  });

  describe('EV-098: Commuter Pass Plans', () => {
    it('should create and list 30-day corridor pass plan', async () => {
      const plan = await passesService.createPlan({
        code: 'PASS-AP-VJA-GNT-30D',
        name: 'Vijayawada – Guntur Monthly Shuttle Pass',
        city: 'Vijayawada',
        passType: CommuterPassType.MONTHLY_UNLIMITED,
        pricePaise: 120000, // ₹1,200.00
        validityDays: 30,
        rideLimit: 60,
      });

      expect(plan.code).toBe('PASS-AP-VJA-GNT-30D');
      expect(plan.pricePaise).toBe(120000);
      expect(plan.formattedPrice).toBe('₹1200.00');
      expect(plan.rideLimit).toBe(60);

      const plans = await passesService.listPlans();
      expect(plans.length).toBe(1);
    });
  });

  describe('EV-099 & EV-100: Commuter Pass Purchase & Escrow Accounting', () => {
    let planId: string;

    beforeEach(async () => {
      const plan = await passesService.createPlan({
        code: 'PASS-AP-VJA-GNT-30D',
        name: 'Vijayawada – Guntur Monthly Shuttle Pass',
        city: 'Vijayawada',
        passType: CommuterPassType.MONTHLY_UNLIMITED,
        pricePaise: 120000,
        validityDays: 30,
        rideLimit: 60,
      });
      planId = plan.id;
    });

    it('should purchase a pass and post balanced double-entry ledger entries to escrow', async () => {
      const rider = { id: 'rider_pass_buyer_001', role: 'RIDER', scopes: [] };

      const pass = await passesService.purchasePass(rider, {
        planId,
        idempotencyKey: 'idem_pass_purchase_1',
      });

      expect(pass.status).toBe(CommuterPassStatus.ACTIVE);
      expect(pass.totalRidesAllocated).toBe(60);
      expect(pass.ridesRemaining).toBe(60);
      expect(pass.passNumber).toMatch(/^PASS-AP-/);

      // Verify ledger entries
      expect(storedLedgerEntries.length).toBe(2);
      const debitRider = storedLedgerEntries.find((e) => e.entryType === 'DEBIT');
      const creditEscrow = storedLedgerEntries.find((e) => e.entryType === 'CREDIT');

      expect(debitRider?.accountId).toBe(`RIDER_ACCOUNT_${rider.id}`);
      expect(debitRider?.amountPaise).toBe(120000);
      expect(creditEscrow?.accountId).toBe('ADVANCE_PASS_ESCROW_LIABILITY');
      expect(creditEscrow?.amountPaise).toBe(120000);
    });
  });

  describe('EV-101: Pass Redemption & Earned Revenue Recognition', () => {
    let passId: string;

    beforeEach(async () => {
      const plan = await passesService.createPlan({
        code: 'PASS-FLEXI-10',
        name: '10-Ride Corridor Flexi Pass',
        city: 'Vijayawada',
        passType: CommuterPassType.FLEXI_10_RIDE,
        pricePaise: 30000, // ₹300 for 10 rides = ₹30 per ride
        validityDays: 30,
        rideLimit: 2, // 2 rides for quick exhaustion test
      });

      const pass = await passesService.purchasePass(
        { id: 'rider_001', role: 'RIDER', scopes: [] },
        { planId: plan.id },
      );
      passId = pass.id;
    });

    it('should redeem 1 ride, recognize revenue from escrow, and transition to EXHAUSTED on final ride', async () => {
      const rider = { id: 'rider_001', role: 'RIDER', scopes: [] };

      // 1st redemption
      const red1 = await passesService.redeemPass(rider, {
        passId,
        idempotencyKey: 'idem_red_1',
      });
      expect(red1.ridesRemaining).toBe(1);
      expect(red1.status).toBe(CommuterPassStatus.ACTIVE);

      // 2nd redemption (exhaustion)
      const red2 = await passesService.redeemPass(rider, {
        passId,
        idempotencyKey: 'idem_red_2',
      });
      expect(red2.ridesRemaining).toBe(0);
      expect(red2.status).toBe(CommuterPassStatus.EXHAUSTED);

      // 3rd redemption must be rejected (exhausted)
      await expect(
        passesService.redeemPass(rider, { passId, idempotencyKey: 'idem_red_3' }),
      ).rejects.toThrow();
    });
  });

  describe('EV-109: SLA Delay Compensation', () => {
    it('should disburse delay compensation to all affected passengers on delayed trip', async () => {
      const tripId = 'trip_delayed_uuid_999';

      // Seed 2 passengers on the delayed trip
      storedReservations.push(
        { id: 'res_1', tripId, riderId: 'rider_delayed_1' } as CorridorSeatReservation,
        { id: 'res_2', tripId, riderId: 'rider_delayed_2' } as CorridorSeatReservation,
      );

      const opsActor = { id: 'ops_officer_001', role: 'OPERATOR', scopes: [] };

      const response = await passesService.applySlaDelayCompensation(opsActor, {
        tripId,
        delayMinutes: 25, // 25 min delay (exceeds 15m threshold)
        compensationPaise: 5000, // ₹50.00
        reason: 'EV bus charging station grid outage at Mangalagiri hub',
      });

      expect(response.compensatedPassengersCount).toBe(2);
      expect(response.totalCompensationPaise).toBe(10000); // 2 * 5000 = ₹100.00
      expect(response.formattedTotal).toBe('₹100.00');

      // Verify double-entry ledger entries (Platform Expense DEBIT, Rider Wallet CREDIT)
      const compEntries = storedLedgerEntries.filter((e) =>
        e.idempotencyKey.includes('sla_comp_'),
      );
      expect(compEntries.length).toBe(4); // 2 debits + 2 credits
    });

    it('should reject SLA compensation for delays under 15 minutes', async () => {
      const opsActor = { id: 'ops_officer_001', role: 'OPERATOR', scopes: [] };
      await expect(
        passesService.applySlaDelayCompensation(opsActor, {
          tripId: 'trip_123',
          delayMinutes: 10, // Under 15m
          compensationPaise: 5000,
          reason: 'Minor traffic slow down',
        }),
      ).rejects.toThrow();
    });
  });

  describe('CommuterPassesController Endpoints', () => {
    it('should route listPlans through CommuterPassesController', async () => {
      await passesService.createPlan({
        code: 'PASS-DEMO',
        name: 'Demo Pass',
        city: 'Guntur',
        passType: CommuterPassType.STUDENT_PASS,
        pricePaise: 50000,
        validityDays: 30,
        rideLimit: 30,
      });

      const plans = await passesController.listPlans();
      expect(plans.length).toBe(1);
      expect(plans[0].code).toBe('PASS-DEMO');
    });
  });
});

