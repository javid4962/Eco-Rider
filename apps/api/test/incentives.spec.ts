import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { IncentivesService } from '../src/modules/incentives/incentives.service';
import { IncentivesController } from '../src/modules/incentives/incentives.controller';
import { IncentiveChallenge } from '../src/database/entities/incentive-challenge.entity';
import { CaptainTierProgress } from '../src/database/entities/captain-tier-progress.entity';
import { Booking } from '../src/database/entities/booking.entity';
import { LedgerEntry } from '../src/database/entities/ledger-entry.entity';
import { CaptainTier } from '@ecoride/contracts';

describe('Automated Driver Incentives & Gamification Engine (M28)', () => {
  let service: IncentivesService;

  const mockChallenges: IncentiveChallenge[] = [
    {
      id: 'challenge-1',
      title: 'Morning Rush Peak Challenge',
      description: 'Complete 5 peak trips in Vijayawada',
      targetTrips: 5,
      rewardPaise: 30000, // ₹300.00
      applicableShift: 'PEAK_MORNING',
      city: 'Vijayawada',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'challenge-2',
      title: 'Weekend Guntur Express',
      description: 'Complete 10 trips in Guntur',
      targetTrips: 10,
      rewardPaise: 50000, // ₹500.00
      applicableShift: 'DAILY_ALL',
      city: 'Guntur',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const mockTierRecords: CaptainTierProgress[] = [];
  const mockLedgerEntries: LedgerEntry[] = [];
  let completedTripsCount = 2;

  const mockChallengeRepo = {
    find: jest.fn().mockResolvedValue(mockChallenges),
    findOne: jest.fn(({ where }) => {
      const match = mockChallenges.find((c) => c.id === where.id);
      return Promise.resolve(match || null);
    }),
    create: jest.fn((dto) => ({ id: 'ch-new', ...dto })),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };

  const mockTierRepo = {
    findOne: jest.fn(({ where }) => {
      const match = mockTierRecords.find((t) => t.captainId === where.captainId);
      return Promise.resolve(match || null);
    }),
    create: jest.fn((dto) => ({ id: 'tier-new', ...dto })),
    save: jest.fn((entity) => {
      const idx = mockTierRecords.findIndex((t) => t.captainId === entity.captainId);
      if (idx >= 0) {
        mockTierRecords[idx] = entity;
      } else {
        mockTierRecords.push(entity);
      }
      return Promise.resolve(entity);
    }),
  };

  const mockBookingRepo = {
    count: jest.fn().mockImplementation(() => Promise.resolve(completedTripsCount)),
  };

  const mockEntityManager = {
    create: jest.fn((_entityClass, dto) => ({ id: `uuid-${Math.random()}`, ...dto })),
    save: jest.fn((_entityClassOrEntities, maybeEntities) => {
      const toSave = maybeEntities || _entityClassOrEntities;
      const list = Array.isArray(toSave) ? toSave : [toSave];
      list.forEach((item) => mockLedgerEntries.push(item));
      return Promise.resolve(toSave);
    }),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    mockTierRecords.length = 0;
    mockLedgerEntries.length = 0;
    completedTripsCount = 2;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncentivesController],
      providers: [
        IncentivesService,
        { provide: getRepositoryToken(IncentiveChallenge), useValue: mockChallengeRepo },
        { provide: getRepositoryToken(CaptainTierProgress), useValue: mockTierRepo },
        { provide: getRepositoryToken(Booking), useValue: mockBookingRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<IncentivesService>(IncentivesService);
  });

  describe('Captain Tier Progression', () => {
    it('should assign BRONZE tier for low weekly trips (< 20)', async () => {
      completedTripsCount = 12;
      const tierData = await service.getCaptainTier('captain-1');

      expect(tierData.tier).toBe(CaptainTier.BRONZE);
      expect(tierData.commissionDiscountBps).toBe(0);
      expect(tierData.perTripBonusPaise).toBe(0);
    });

    it('should assign SILVER tier for 20-39 weekly trips with 1% discount', async () => {
      completedTripsCount = 25;
      const tierData = await service.getCaptainTier('captain-2');

      expect(tierData.tier).toBe(CaptainTier.SILVER);
      expect(tierData.commissionDiscountBps).toBe(100); // 100 bps = 1%
      expect(tierData.perTripBonusPaise).toBe(500);     // ₹5.00
    });

    it('should assign GOLD tier for 40-69 weekly trips with 2% discount', async () => {
      completedTripsCount = 48;
      const tierData = await service.getCaptainTier('captain-3');

      expect(tierData.tier).toBe(CaptainTier.GOLD);
      expect(tierData.commissionDiscountBps).toBe(200); // 200 bps = 2%
      expect(tierData.perTripBonusPaise).toBe(1000);    // ₹10.00
    });

    it('should assign PLATINUM tier for 70+ weekly trips with 3% discount and bonus', async () => {
      completedTripsCount = 75;
      const tierData = await service.getCaptainTier('captain-4');

      expect(tierData.tier).toBe(CaptainTier.PLATINUM);
      expect(tierData.commissionDiscountBps).toBe(300); // 300 bps = 3%
      expect(tierData.perTripBonusPaise).toBe(1500);    // ₹15.00
    });
  });

  describe('Incentive Challenges & Progress', () => {
    it('should list active challenges filtered by city', async () => {
      const vjaChallenges = await service.listActiveChallenges('Vijayawada');
      expect(vjaChallenges.length).toBe(1);
      expect(vjaChallenges[0].city).toBe('Vijayawada');

      const allChallenges = await service.listActiveChallenges();
      expect(allChallenges.length).toBe(2);
    });

    it('should report locked challenge progress when target trips not met', async () => {
      completedTripsCount = 3; // Target is 5
      const progress = await service.getCaptainChallengeProgress('captain-1', 'challenge-1');

      expect(progress.targetTrips).toBe(5);
      expect(progress.completedTrips).toBe(3);
      expect(progress.isUnlocked).toBe(false);
    });

    it('should report unlocked challenge progress when target trips met', async () => {
      completedTripsCount = 5; // Target is 5
      const progress = await service.getCaptainChallengeProgress('captain-1', 'challenge-1');

      expect(progress.isUnlocked).toBe(true);
      expect(progress.rewardPaise).toBe(30000);
      expect(progress.formattedReward).toBe('₹300.00');
    });
  });

  describe('Awarding Challenge Rewards via Double-Entry Ledger', () => {
    it('should reject claiming reward for an unlocked challenge', async () => {
      completedTripsCount = 2; // Target 5
      await expect(
        service.awardChallengeReward('captain-1', 'challenge-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should award reward and execute balanced double-entry ledger entries', async () => {
      completedTripsCount = 6; // Target 5 (unlocked)
      const res = await service.awardChallengeReward('captain-1', 'challenge-1');

      expect(res.captainId).toBe('captain-1');
      expect(res.rewardPaise).toBe(30000);
      expect(res.ledgerTransactionId).toBeDefined();

      // Verify balanced double-entry ledger entries
      expect(mockLedgerEntries.length).toBe(2);

      const debit = mockLedgerEntries.find((e) => e.entryType === 'DEBIT')!;
      const credit = mockLedgerEntries.find((e) => e.entryType === 'CREDIT')!;

      expect(debit).toBeDefined();
      expect(credit).toBeDefined();
      expect(debit.accountId).toBe('platform:incentives_pool');
      expect(credit.accountId).toBe('captain:captain-1:wallet');

      // Strict parity check
      expect(debit.amountPaise).toBe(30000);
      expect(credit.amountPaise).toBe(30000);
      expect(debit.amountPaise).toBe(credit.amountPaise);
    });
  });
});

