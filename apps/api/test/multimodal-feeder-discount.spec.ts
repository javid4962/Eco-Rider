import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MultimodalFeederDiscountService } from '../src/modules/multimodal-feeder-discount/multimodal-feeder-discount.service';
import { MultimodalFeederDiscountController } from '../src/modules/multimodal-feeder-discount/multimodal-feeder-discount.controller';
import { MultimodalFeederDiscountClaimEntity } from '../src/database/entities/multimodal-feeder-discount-claim.entity';

describe('MultimodalFeederDiscountModule', () => {
  let service: MultimodalFeederDiscountService;
  let controller: MultimodalFeederDiscountController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-claim-uuid',
      claimedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultimodalFeederDiscountController],
      providers: [
        MultimodalFeederDiscountService,
        {
          provide: getRepositoryToken(MultimodalFeederDiscountClaimEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<MultimodalFeederDiscountService>(MultimodalFeederDiscountService);
    controller = module.get<MultimodalFeederDiscountController>(MultimodalFeederDiscountController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should calculate ₹25 (2500 paise) discount when pickup is within 800m of Vijayawada PNBS', async () => {
    // PNBS is at (16.5074, 80.6277). Pickup at (16.5080, 80.6280) is ~70m away
    const calc = controller.calculateDiscount({
      riderId: 'RIDER-AP-01',
      bookingId: 'BK-PNBS-01',
      transitHubId: 'BZA_PNBS',
      pickupLat: 16.508,
      pickupLng: 80.628,
      dropoffLat: 16.48,
      dropoffLng: 80.65,
    });

    expect(calc.eligible).toBe(true);
    expect(calc.discountPaise).toBe(2500);
    expect(calc.subsidyFundSource).toBe('AP_URBAN_DECONGESTION_FUND');
  });

  it('should not award discount when trip is far from transit hub', async () => {
    const calc = controller.calculateDiscount({
      riderId: 'RIDER-AP-02',
      bookingId: 'BK-REMOTE-02',
      transitHubId: 'BZA_PNBS',
      pickupLat: 16.58, // far north
      pickupLng: 80.7,
      dropoffLat: 16.6,
      dropoffLng: 80.72,
    });

    expect(calc.eligible).toBe(false);
    expect(calc.discountPaise).toBe(0);
  });

  it('should claim discount and persist claim record', async () => {
    const claim = await controller.claimDiscount({
      riderId: 'RIDER-AP-01',
      bookingId: 'BK-PNBS-01',
      transitHubId: 'BZA_PNBS',
      pickupLat: 16.508,
      pickupLng: 80.628,
      dropoffLat: 16.48,
      dropoffLng: 80.65,
    });

    expect(claim.claimId).toBe('CLAIM-BK-PNBS-01-BZA_PNBS');
    expect(claim.discountPaise).toBe(2500);
  });
});
