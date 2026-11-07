import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GpsMultipathRejectionService } from '../src/modules/gps-multipath-rejection/gps-multipath-rejection.service';
import { GpsMultipathRejectionController } from '../src/modules/gps-multipath-rejection/gps-multipath-rejection.controller';
import { GpsMultipathFilterLogEntity } from '../src/database/entities/gps-multipath-filter-log.entity';

describe('GpsMultipathRejectionModule', () => {
  let service: GpsMultipathRejectionService;
  let controller: GpsMultipathRejectionController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-gps-log-uuid',
      recordedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpsMultipathRejectionController],
      providers: [
        GpsMultipathRejectionService,
        {
          provide: getRepositoryToken(GpsMultipathFilterLogEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<GpsMultipathRejectionService>(GpsMultipathRejectionService);
    controller = module.get<GpsMultipathRejectionController>(GpsMultipathRejectionController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should list configured AP urban canyon reflection zones', () => {
    const zones = controller.getCanyonZones();
    expect(zones.length).toBeGreaterThanOrEqual(3);
    expect(zones.some((z) => z.name.includes('Besant Road'))).toBe(true);
  });

  it('should detect multipath reflections and apply drift correction in Besant Road canyon', async () => {
    // Besant Road is at (16.510, 80.623)
    const filtered = await controller.filterGnssFix({
      vehicleId: 'EV-AUTO-AP37-0099',
      latitude: 16.5102,
      longitude: 80.6231,
      altitudeMeters: 22,
      speedKmph: 12,
      hdop: 3.8, // high hdop
      satellitesInView: 4, // low satellite count
      wheelTickSpeedKmph: 11,
      timestamp: new Date().toISOString(),
    });

    expect(filtered.isMultipathDetected).toBe(true);
    expect(filtered.canyonZoneName).toContain('Besant Road');
    expect(filtered.correctedDriftMeters).toBeGreaterThan(0);
    expect(filtered.confidenceScore).toBeLessThan(0.8);
  });

  it('should maintain high confidence on open unobstructed roads', async () => {
    // Open highway outside canyon
    const filtered = await service.filterGnssFix({
      vehicleId: 'EV-AUTO-AP37-0099',
      latitude: 16.45,
      longitude: 80.55,
      altitudeMeters: 25,
      speedKmph: 45,
      hdop: 0.9,
      satellitesInView: 12,
      wheelTickSpeedKmph: 45,
      timestamp: new Date().toISOString(),
    });

    expect(filtered.isMultipathDetected).toBe(false);
    expect(filtered.confidenceScore).toBe(0.95);
    expect(filtered.correctedDriftMeters).toBe(0);
  });
});
