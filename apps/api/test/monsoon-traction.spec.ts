import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonsoonTractionService } from '../src/modules/monsoon-traction/monsoon-traction.service';
import { MonsoonTractionEvent } from '../src/database/entities/monsoon-traction-event.entity';
import { MonsoonAdaptiveMode, RoadConditionState } from '@ecoride/contracts';

describe('MonsoonTractionService (M99)', () => {
  let service: MonsoonTractionService;
  let repo: Partial<Record<keyof Repository<MonsoonTractionEvent>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-event-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonsoonTractionService,
        {
          provide: getRepositoryToken(MonsoonTractionEvent),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<MonsoonTractionService>(MonsoonTractionService);
  });

  it('should maintain full performance on dry asphalt surface (mu = 0.8)', async () => {
    const result = await service.evaluateRoadCondition({
      vehicleId: 'EV-SEDAN-01',
      latitude: 16.5062,
      longitude: 80.6480,
      surfaceFrictionMu: 0.8,
      wheelSlipPercent: 2.0,
      wiperSpeedLevel: 0,
      rainSensorMmPerHour: 0,
    });

    expect(result.roadCondition).toBe(RoadConditionState.DRY_HIGH_TRACTION);
    expect(result.recommendedMode).toBe(MonsoonAdaptiveMode.NORMAL_DRIVE);
    expect(result.maxTorqueLimitPercent).toBe(100);
    expect(result.maxSpeedLimitKmh).toBe(80);
    expect(result.warningAlert).toBeNull();
  });

  it('should activate traction stability assist and throttle torque to 70% during moderate monsoon rain', async () => {
    const result = await service.evaluateRoadCondition({
      vehicleId: 'EV-SEDAN-02',
      latitude: 16.4800,
      longitude: 80.6200,
      surfaceFrictionMu: 0.45,
      wheelSlipPercent: 8.5,
      wiperSpeedLevel: 2,
      rainSensorMmPerHour: 18.0,
    });

    expect(result.roadCondition).toBe(RoadConditionState.WET_ASPHALT_MODERATE);
    expect(result.recommendedMode).toBe(MonsoonAdaptiveMode.TRACTION_STABILITY_ASSIST);
    expect(result.maxTorqueLimitPercent).toBe(70);
    expect(result.maxSpeedLimitKmh).toBe(50);
    expect(result.warningAlert).toContain('Wet monsoon road conditions detected');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should activate extreme monsoon crawl mode (40% torque, 30 km/h cap) during heavy hydroplaning risk', async () => {
    const result = await service.evaluateRoadCondition({
      vehicleId: 'EV-AUTO-03',
      latitude: 16.5100,
      longitude: 80.6100,
      surfaceFrictionMu: 0.22, // very slippery
      wheelSlipPercent: 18.0,  // severe wheel spin
      wiperSpeedLevel: 3,
      rainSensorMmPerHour: 45.0, // torrential rain
    });

    expect(result.roadCondition).toBe(RoadConditionState.FLOODED_HYDROPLANE_RISK);
    expect(result.recommendedMode).toBe(MonsoonAdaptiveMode.EXTREME_MONSOON_CRAWL);
    expect(result.maxTorqueLimitPercent).toBe(40);
    expect(result.maxSpeedLimitKmh).toBe(30);
    expect(result.warningAlert).toContain('CRITICAL: Hydroplaning');
  });
});

