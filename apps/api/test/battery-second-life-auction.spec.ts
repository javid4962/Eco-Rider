import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BatterySecondLifeAuctionService } from '../src/modules/battery-second-life-auction/battery-second-life-auction.service';
import { BatterySecondLifeAuctionController } from '../src/modules/battery-second-life-auction/battery-second-life-auction.controller';
import { BatterySecondLifeListingEntity } from '../src/database/entities/battery-second-life-listing.entity';
import { SecondLifeAuctionStatus, SecondLifeGrade } from '@ecoride/contracts';

describe('BatterySecondLifeAuctionModule', () => {
  let service: BatterySecondLifeAuctionService;
  let controller: BatterySecondLifeAuctionController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-second-life-uuid',
      evaluatedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-second-life-uuid') {
        return {
          id: 'mock-second-life-uuid',
          grade: SecondLifeGrade.TIER_1_STATIONARY_STORAGE,
          status: SecondLifeAuctionStatus.ASSIGNED_TO_BESS,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatterySecondLifeAuctionController],
      providers: [
        BatterySecondLifeAuctionService,
        {
          provide: getRepositoryToken(BatterySecondLifeListingEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BatterySecondLifeAuctionService>(BatterySecondLifeAuctionService);
    controller = module.get<BatterySecondLifeAuctionController>(BatterySecondLifeAuctionController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should classify pack with 70% SoH as Tier 1 stationary storage and assign to Amaravathi Central Depot BESS', async () => {
    const listing = await controller.value({
      packSerial: 'PACK-LFP-AP39-2022',
      originalCapacityKwh: 40.0,
      currentSohPercent: 70.0,
      cycleCount: 2200,
      depotLocation: 'AMARAVATHI_CENTRAL_DEPOT',
    });

    expect(listing.remainingCapacityKwh).toBe(28.0); // 40 * 0.70
    expect(listing.grade).toBe(SecondLifeGrade.TIER_1_STATIONARY_STORAGE);
    expect(listing.status).toBe(SecondLifeAuctionStatus.ASSIGNED_TO_BESS);
    expect(listing.estimatedSalvageValuationPaise).toBe(12600000); // 28 kWh * ₹4,500 = ₹1,26,000 (12,600,000 paise)
    expect(listing.recommendedStationaryBessDepot).toBe('AMARAVATHI_CENTRAL_DEPOT');
  });

  it('should flag pack with < 50% SoH for certified materials recycling only', async () => {
    const listing = await controller.value({
      packSerial: 'PACK-NMC-2020-DEAD',
      originalCapacityKwh: 30.0,
      currentSohPercent: 44.0, // < 50% SoH
      cycleCount: 3800,
      depotLocation: 'VIJAYAWADA_DEPOT',
    });

    expect(listing.grade).toBe(SecondLifeGrade.RECYCLING_ONLY);
    expect(listing.status).toBe(SecondLifeAuctionStatus.RECYCLED);
    expect(listing.estimatedSalvageValuationPaise).toBe(500000); // ₹5,000 scrap
    expect(listing.recommendedStationaryBessDepot).toBe('AP_RECYCLING_PLANT_VIJAYAWADA');
  });
});
