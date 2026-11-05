import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DynamicCongestionService } from '../src/modules/dynamic-congestion/dynamic-congestion.service';
import { CongestionZone } from '../src/database/entities/congestion-zone.entity';

describe('DynamicCongestionService (M72)', () => {
  let service: DynamicCongestionService;
  let mockRepo: any;

  const mockBenzCircleZone: Partial<CongestionZone> = {
    id: 'zone-benz-01',
    zoneCode: 'BENZ_CIRCLE_VIJ',
    zoneName: 'Benz Circle Corridor',
    city: 'VIJAYAWADA',
    centerLatitude: 16.4971,
    centerLongitude: 80.6515,
    radiusMeters: 2000,
    baseCongestionFeePaise: 2500, // ₹25.00
    maxMultiplier: 2.0,
    isActive: true,
  };

  beforeEach(async () => {
    mockRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicCongestionService,
        {
          provide: getRepositoryToken(CongestionZone),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DynamicCongestionService>(DynamicCongestionService);
  });

  it('should return 0 surcharge during non-peak hours in Andhra Pradesh', async () => {
    mockRepo.findOne.mockResolvedValue(mockBenzCircleZone);

    const result = await service.calculateSurcharge({
      zoneCode: 'BENZ_CIRCLE_VIJ',
      pickupLat: 16.497,
      pickupLng: 80.651,
      activeVehiclesCount: 40,
      roadCongestionFactor: 1.8,
      hourIST: 14, // 14:00 IST is non-peak afternoon
    });

    expect(result.isCongestionActive).toBe(false);
    expect(result.calculatedSurchargePaise).toBe(0);
    expect(result.totalSurchargeWithGstPaise).toBe(0);
  });

  it('should apply congestion fee, 5% AP GST, and 20% municipal green contribution during peak hours', async () => {
    mockRepo.findOne.mockResolvedValue(mockBenzCircleZone);

    const result = await service.calculateSurcharge({
      zoneCode: 'BENZ_CIRCLE_VIJ',
      pickupLat: 16.497,
      pickupLng: 80.651,
      activeVehiclesCount: 150,
      roadCongestionFactor: 1.5,
      hourIST: 9, // 09:00 IST morning peak
    });

    expect(result.isCongestionActive).toBe(true);
    // Base 2500 * 1.5 = 3750 paise
    expect(result.calculatedSurchargePaise).toBe(3750);
    // 5% GST = 188 paise
    expect(result.statutoryGstPaise).toBe(188);
    expect(result.totalSurchargeWithGstPaise).toBe(3938);
    // 20% municipal contribution = 750 paise
    expect(result.municipalContributionPaise).toBe(750);
  });

  it('should cap congestion multiplier at zone maximum multiplier', async () => {
    mockRepo.findOne.mockResolvedValue(mockBenzCircleZone);

    const result = await service.calculateSurcharge({
      zoneCode: 'BENZ_CIRCLE_VIJ',
      pickupLat: 16.497,
      pickupLng: 80.651,
      activeVehiclesCount: 300,
      roadCongestionFactor: 3.5, // Exceeds max 2.0
      hourIST: 18, // 18:00 IST evening peak
    });

    expect(result.isCongestionActive).toBe(true);
    expect(result.congestionMultiplier).toBe(2.0);
    // 2500 * 2.0 = 5000 paise
    expect(result.calculatedSurchargePaise).toBe(5000);
  });

  it('should throw NotFoundException if zone code does not exist', async () => {
    mockRepo.findOne.mockResolvedValue(null);

    await expect(
      service.calculateSurcharge({
        zoneCode: 'INVALID_ZONE',
        pickupLat: 16.0,
        pickupLng: 80.0,
        activeVehiclesCount: 10,
        roadCongestionFactor: 1.5,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
