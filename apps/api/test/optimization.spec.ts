import { Test, TestingModule } from '@nestjs/testing';
import { OptimizationService } from '../src/modules/optimization/optimization.service';
import { OptimizationController } from '../src/modules/optimization/optimization.controller';

describe('Post-Launch Optimization & Battery Research Engine (M26)', () => {
  let service: OptimizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OptimizationController],
      providers: [OptimizationService],
    }).compile();

    service = module.get<OptimizationService>(OptimizationService);
  });

  describe('Congestion-Aware Corridor Routing', () => {
    it('should select Inner Ring Road Diversion during peak morning rush', () => {
      const peakTime = '2026-11-05T09:30:00+05:30'; // 09:30 AM IST
      const route = service.optimizeCorridorRoute(
        16.502,
        80.648,
        16.5415,
        80.5155,
        peakTime,
      );

      expect(route.recommendedRouteName).toContain('Vijayawada Bypass');
      expect(route.congestionAvoidanceScore).toBe(85);
      expect(route.waypoints.length).toBe(3);
    });

    it('should select direct expressway during off-peak hours', () => {
      const offPeakTime = '2026-11-05T14:00:00+05:30'; // 02:00 PM IST
      const route = service.optimizeCorridorRoute(
        16.502,
        80.648,
        16.5415,
        80.5155,
        offPeakTime,
      );

      expect(route.recommendedRouteName).toContain('NH-16 Direct Expressway');
      expect(route.estimatedDurationMinutes).toBe(24);
      expect(route.congestionAvoidanceScore).toBe(92);
    });
  });

  describe('EV Battery Degradation Simulation Model', () => {
    it('should project battery health under AP high-temperature climatic conditions', () => {
      const sim = service.simulateBatteryDegradation(
        'veh-ev-101',
        40.0,
        40000, // 40,000 km
        75,    // 75% DC fast charging
        42,    // 42°C Vijayawada peak summer
      );

      expect(sim.vehicleId).toBe('veh-ev-101');
      expect(sim.projectedStateOfHealthPercent).toBeLessThan(100);
      expect(sim.projectedStateOfHealthPercent).toBeGreaterThanOrEqual(70);
      expect(sim.estimatedRemainingCycles).toBeGreaterThan(1000);
      expect(sim.recommendedChargingStrategy).toContain('Shift to overnight 7.4kW Type 2 AC charging');
    });

    it('should show optimal strategy for balanced low-DC charging mix', () => {
      const sim = service.simulateBatteryDegradation(
        'veh-ev-102',
        40.0,
        20000,
        30, // 30% DC fast charging
        30, // 30°C mild weather
      );

      expect(sim.projectedStateOfHealthPercent).toBeGreaterThanOrEqual(95);
      expect(sim.recommendedChargingStrategy).toContain('optimal for AP climate');
    });
  });
});
