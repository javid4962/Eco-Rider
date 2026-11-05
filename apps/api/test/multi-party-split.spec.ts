import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MultiPartySplitService } from '../src/modules/multi-party-split/multi-party-split.service';
import { MultiPartySplitController } from '../src/modules/multi-party-split/multi-party-split.controller';
import { SplitPayoutBatch } from '../src/database/entities/split-payout-batch.entity';
import { SplitPayoutItem } from '../src/database/entities/split-payout-item.entity';

describe('MultiPartySplitService (M53)', () => {
  let service: MultiPartySplitService;
  let mockBatchRepo: any;
  let mockItemRepo: any;

  beforeEach(async () => {
    mockBatchRepo = {
      create: jest.fn((e) => ({ ...e, id: 'batch-123', processedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    mockItemRepo = {
      create: jest.fn((e) => ({ ...e, id: 'item-123', createdAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultiPartySplitController],
      providers: [
        MultiPartySplitService,
        { provide: getRepositoryToken(SplitPayoutBatch), useValue: mockBatchRepo },
        { provide: getRepositoryToken(SplitPayoutItem), useValue: mockItemRepo },
      ],
    }).compile();

    service = module.get<MultiPartySplitService>(MultiPartySplitService);
  });

  it('should split gross ride fare with exact ledger balance parity', async () => {
    // Gross ₹100.00 (10000 paise). 5% GST = 500 paise. Net = 9500 paise.
    // Platform 20% = 1900 paise. Captain 80% = 7600 paise.
    const res = await service.executeSplitPayout({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      grossFarePaise: 10000,
      captainId: 'c0000000-0000-4000-8000-000000000001',
      captainVpa: 'captain@upi',
    });

    expect(res.totalGrossFarePaise).toBe(10000);
    expect(res.gstPaise).toBe(500);
    expect(res.platformFeePaise).toBe(1900);
    expect(res.captainSharePaise).toBe(7600);
    expect(res.fleetOwnerSharePaise).toBe(0);
    expect(res.captainSharePaise + res.platformFeePaise + res.gstPaise).toBe(10000);
    expect(res.disbursedItems.length).toBe(2);
  });

  it('should disburse multi-party split including fleet lease owner share', async () => {
    // Gross ₹200.00 (20000 paise). 5% GST = 1000 paise. Net = 19000 paise.
    // Platform 20% = 3800 paise. Owner 30% = 5700 paise. Captain remainder = 9500 paise.
    const res = await service.executeSplitPayout({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      grossFarePaise: 20000,
      captainId: 'c0000000-0000-4000-8000-000000000001',
      captainVpa: 'captain@upi',
      fleetOwnerId: 'o0000000-0000-4000-8000-000000000001',
      fleetOwnerVpa: 'fleetowner@upi',
      ownerSharePercent: 30.0,
    });

    expect(res.fleetOwnerSharePaise).toBe(5700);
    expect(res.captainSharePaise).toBe(9500);
    expect(res.platformFeePaise).toBe(3800);
    expect(res.gstPaise).toBe(1000);
    expect(res.captainSharePaise + res.fleetOwnerSharePaise + res.platformFeePaise + res.gstPaise).toBe(20000);
    expect(res.disbursedItems.length).toBe(3);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MultiPartySplitService } from '../src/modules/multi-party-split/multi-party-split.service';
import { MultiPartySplitController } from '../src/modules/multi-party-split/multi-party-split.controller';
import { SplitPayoutBatch } from '../src/database/entities/split-payout-batch.entity';
import { SplitPayoutItem } from '../src/database/entities/split-payout-item.entity';

describe('MultiPartySplitService (M53)', () => {
  let service: MultiPartySplitService;
  let mockBatchRepo: any;
  let mockItemRepo: any;

  beforeEach(async () => {
    mockBatchRepo = {
      create: jest.fn((e) => ({ ...e, id: 'batch-123', processedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    mockItemRepo = {
      create: jest.fn((e) => ({ ...e, id: 'item-123', createdAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultiPartySplitController],
      providers: [
        MultiPartySplitService,
        { provide: getRepositoryToken(SplitPayoutBatch), useValue: mockBatchRepo },
        { provide: getRepositoryToken(SplitPayoutItem), useValue: mockItemRepo },
      ],
    }).compile();

    service = module.get<MultiPartySplitService>(MultiPartySplitService);
  });

  it('should split gross ride fare with exact ledger balance parity', async () => {
    // Gross ₹100.00 (10000 paise). 5% GST = 500 paise. Net = 9500 paise.
    // Platform 20% = 1900 paise. Captain 80% = 7600 paise.
    const res = await service.executeSplitPayout({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      grossFarePaise: 10000,
      captainId: 'c0000000-0000-4000-8000-000000000001',
      captainVpa: 'captain@upi',
    });

    expect(res.totalGrossFarePaise).toBe(10000);
    expect(res.gstPaise).toBe(500);
    expect(res.platformFeePaise).toBe(1900);
    expect(res.captainSharePaise).toBe(7600);
    expect(res.fleetOwnerSharePaise).toBe(0);
    expect(res.captainSharePaise + res.platformFeePaise + res.gstPaise).toBe(10000);
    expect(res.disbursedItems.length).toBe(2);
  });

  it('should disburse multi-party split including fleet lease owner share', async () => {
    // Gross ₹200.00 (20000 paise). 5% GST = 1000 paise. Net = 19000 paise.
    // Platform 20% = 3800 paise. Owner 30% = 5700 paise. Captain remainder = 9500 paise.
    const res = await service.executeSplitPayout({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      grossFarePaise: 20000,
      captainId: 'c0000000-0000-4000-8000-000000000001',
      captainVpa: 'captain@upi',
      fleetOwnerId: 'o0000000-0000-4000-8000-000000000001',
      fleetOwnerVpa: 'fleetowner@upi',
      ownerSharePercent: 30.0,
    });

    expect(res.fleetOwnerSharePaise).toBe(5700);
    expect(res.captainSharePaise).toBe(9500);
    expect(res.platformFeePaise).toBe(3800);
    expect(res.gstPaise).toBe(1000);
    expect(res.captainSharePaise + res.fleetOwnerSharePaise + res.platformFeePaise + res.gstPaise).toBe(20000);
    expect(res.disbursedItems.length).toBe(3);
  });
});

