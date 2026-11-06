import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CleanEnergyRoutingService } from '../src/modules/clean-energy/clean-energy-routing.service';
import { DepotSolarGeneration } from '../src/database/entities/depot-solar-generation.entity';

describe('CleanEnergyRoutingService (Milestone M64)', () => {
  let service: CleanEnergyRoutingService;

  const mockDepots: any[] = [];

  const mockRepo = {
    find: jest.fn().mockImplementation(() => Promise.resolve([...mockDepots])),
    create: jest.fn().mockImplementation((dto) => ({
      id: `solar-${Date.now()}`,
      ...dto,
      recordedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((entry) => {
      mockDepots.push(entry);
      return Promise.resolve(entry);
    }),
  };

  beforeEach(async () => {
    mockDepots.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanEnergyRoutingService,
        { provide: getRepositoryToken(DepotSolarGeneration), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CleanEnergyRoutingService>(CleanEnergyRoutingService);
  });

  it('should return default solar charging depot when no live records exist', async () => {
    const res = await service.findOptimalDepot({
      currentLatitude: 16.5062,
      currentLongitude: 80.648,
      requiredKwh: 30,
    });

    expect(res).toBeDefined();
    expect(res.depotName).toContain('Amaravathi Capital Solar EV Depot');
    expect(res.greenEnergyPercentage).toBeGreaterThanOrEqual(90);
    expect(res.estimatedCo2SavedGrams).toBeGreaterThan(0);
  });

  it('should select depot with highest green energy percentage from active depots', async () => {
    await service.recordSolarTelemetry({
      depotId: '00000000-0000-0000-0000-000000000001',
      depotName: 'Vijayawada Auto Nagar Standard Depot',
      currentSolarOutputKw: 45.0,
      gridCarbonIntensityGCo2Kwh: 500,
      greenEnergyPercentage: 45.0,
      updatedAt: new Date().toISOString(),
    });

    await service.recordSolarTelemetry({
      depotId: '00000000-0000-0000-0000-000000000002',
      depotName: 'Amaravathi High Solar Mega Depot',
      currentSolarOutputKw: 250.0,
      gridCarbonIntensityGCo2Kwh: 60,
      greenEnergyPercentage: 94.0,
      updatedAt: new Date().toISOString(),
    });

    const res = await service.findOptimalDepot({
      currentLatitude: 16.51,
      currentLongitude: 80.62,
      requiredKwh: 40,
    });

    expect(res.recommendedDepotId).toBe('00000000-0000-0000-0000-000000000002');
    expect(res.depotName).toBe('Amaravathi High Solar Mega Depot');
    expect(res.greenEnergyPercentage).toBe(94.0);
  });

  it('should throw BadRequestException if requiredKwh <= 0', async () => {
    await expect(
      service.findOptimalDepot({
        currentLatitude: 16.5,
        currentLongitude: 80.6,
        requiredKwh: 0,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

