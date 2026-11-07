import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroMobilitySpeedGovernorService } from '../src/modules/micro-mobility-speed-governor/micro-mobility-speed-governor.service';
import { MicroMobilityPedestrianZone } from '../src/database/entities/micro-mobility-pedestrian-zone.entity';
import { PedestrianZoneCategory } from '@ecoride/contracts';

describe('MicroMobilitySpeedGovernorService (M106)', () => {
  let service: MicroMobilitySpeedGovernorService;
  let repo: Partial<Record<keyof Repository<MicroMobilityPedestrianZone>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'zone-besant-rd',
          zoneCode: 'BESANT_ROAD_PEDESTRIAN',
          zoneName: 'Besant Road Commercial Street, Vijayawada',
          category: PedestrianZoneCategory.COMMERCIAL_SHOPPING_STREET,
          minLatitude: 16.5100,
          maxLatitude: 16.5180,
          minLongitude: 80.6200,
          maxLongitude: 80.6280,
          speedLimitKmh: 12,
          isActive: true,
        },
      ]),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicroMobilitySpeedGovernorService,
        {
          provide: getRepositoryToken(MicroMobilityPedestrianZone),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<MicroMobilitySpeedGovernorService>(MicroMobilitySpeedGovernorService);
  });

  it('should trigger speed limiter (12 km/h) and audible chime warning when e-scooter speeds inside Besant Road pedestrian precinct', async () => {
    const result = await service.processGpsTelemetry({
      vehicleId: 'E-SCOOTER-01',
      latitude: 16.5140, // inside Besant road
      longitude: 80.6240,
      currentSpeedKmh: 20.0, // speeding
      batterySocPercent: 75.0,
    });

    expect(result.isInPedestrianZone).toBe(true);
    expect(result.zoneCategory).toBe(PedestrianZoneCategory.COMMERCIAL_SHOPPING_STREET);
    expect(result.enforcedSpeedLimitKmh).toBe(12);
    expect(result.throttleAdjustmentRequired).toBe(true);
    expect(result.audibleChimeWarning).toBe(true);
  });

  it('should maintain standard 25 km/h limit on public roads outside designated pedestrian zones', async () => {
    const result = await service.processGpsTelemetry({
      vehicleId: 'E-SCOOTER-02',
      latitude: 16.4800, // outside pedestrian zone
      longitude: 80.6500,
      currentSpeedKmh: 22.0,
      batterySocPercent: 60.0,
    });

    expect(result.isInPedestrianZone).toBe(false);
    expect(result.enforcedSpeedLimitKmh).toBe(25);
    expect(result.throttleAdjustmentRequired).toBe(false);
    expect(result.audibleChimeWarning).toBe(false);
  });
});
