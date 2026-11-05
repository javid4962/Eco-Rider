import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DisputesService } from '../src/modules/disputes/disputes.service';
import { DisputesController } from '../src/modules/disputes/disputes.controller';
import { CustomerDispute } from '../src/database/entities/customer-dispute.entity';
import { LostItemReport } from '../src/database/entities/lost-item-report.entity';
import { DisputeCategory, DisputeStatus } from '@ecoride/contracts';

describe('DisputesService (M37)', () => {
  let service: DisputesService;
  let mockDisputeRepo: any;
  let mockLostItemRepo: any;

  beforeEach(async () => {
    mockDisputeRepo = {
      create: jest.fn((e) => ({ ...e, id: 'disp-123', createdAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'disp-123' })),
      findOne: jest.fn(),
    };

    mockLostItemRepo = {
      create: jest.fn((e) => ({ ...e, id: 'lost-123', reportedAt: new Date() })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: 'lost-123' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputesController],
      providers: [
        DisputesService,
        { provide: getRepositoryToken(CustomerDispute), useValue: mockDisputeRepo },
        { provide: getRepositoryToken(LostItemReport), useValue: mockLostItemRepo },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
  });

  it('should file standard driver conduct dispute in OPEN status', async () => {
    const dispute = await service.fileDispute({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      complainantUserId: 'u0000000-0000-4000-8000-000000000001',
      complainantRole: 'RIDER',
      category: DisputeCategory.DRIVER_CONDUCT,
      description: 'Driver AC was not turned on during peak noon ride.',
    });

    expect(dispute.ticketNumber).toBeDefined();
    expect(dispute.category).toBe(DisputeCategory.DRIVER_CONDUCT);
    expect(dispute.status).toBe(DisputeStatus.OPEN);
    expect(dispute.autoRefundAppliedPaise).toBeUndefined();
  });

  it('should auto-refund rider when GPS detour exceeds 20%', async () => {
    const dispute = await service.fileDispute({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      complainantUserId: 'u0000000-0000-4000-8000-000000000001',
      complainantRole: 'RIDER',
      category: DisputeCategory.UNAUTHORIZED_ROUTE_DETOUR,
      description: 'Driver took a long loop through Inner Ring Road without consent.',
      scheduledDistanceKm: 10.0,
      actualDistanceKm: 15.0, // 50% detour (> 20%)
      chargedFarePaise: 30000, // ₹300.00
    });

    expect(dispute.status).toBe(DisputeStatus.AUTO_REFUNDED);
    expect(dispute.reMetredDistanceVariancePercent).toBe(50.0);
    expect(dispute.autoRefundAppliedPaise).toBe(10000); // 5km/15km * 30000 = 10000 paise (₹100.00)
    expect(dispute.resolutionNotes).toContain('Autonomous GPS Audit: 50% detour detected');
  });

  it('should report lost item and generate tokenized driver contact link without exposing phone numbers', async () => {
    const item = await service.reportLostItem({
      bookingId: 'b0000000-0000-4000-8000-000000000001',
      riderId: 'u0000000-0000-4000-8000-000000000001',
      itemType: 'Wallet',
      itemDescription: 'Brown leather wallet left on back seat',
    });

    expect(item.reportNumber).toContain('LOST-');
    expect(item.status).toBe('REPORTED');
    expect(item.tokenizedDriverContactUrl).toContain('https://track.ecoride.in/lost-item/');
  });
});

