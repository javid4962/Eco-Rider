import { Injectable } from '@nestjs/common';

export interface RouteOptimizationDto {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  departureTime: string;
  recommendedRouteName: string;
  estimatedDurationMinutes: number;
  estimatedDistanceKm: number;
  congestionAvoidanceScore: number; // 0 - 100
  waypoints: { latitude: number; longitude: number; name: string }[];
}

export interface BatteryDegradationSimulationDto {
  vehicleId: string;
  batteryCapacityKwh: number;
  currentOdometerKm: number;
  dcFastChargeFrequencyPercent: number; // e.g. 70% DC fast, 30% AC slow
  averageAmbientTempCelsius: number;     // e.g. 38°C in Vijayawada summer
  projectedStateOfHealthPercent: number; // e.g. 94.2%
  estimatedRemainingCycles: number;
  recommendedChargingStrategy: string;
}

@Injectable()
export class OptimizationService {
  /**
   * Compute congestion-aware EV routing across the AP Capital Corridor
   */
  optimizeCorridorRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    departureTime: string,
  ): RouteOptimizationDto {
    const depDate = new Date(departureTime || Date.now());
    // Compute Indian Standard Time (IST = UTC + 5:30) hour
    const istTimeMs = depDate.getTime() + 5.5 * 3600000;
    const hour = new Date(istTimeMs).getUTCHours();

    // Check if departure falls within peak traffic hours (08:30 - 11:00 or 17:30 - 20:30)
    const isPeakHour = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20);

    let recommendedRouteName = 'NH-16 Direct Expressway';
    let estimatedDurationMinutes = 24;
    let estimatedDistanceKm = 18.5;
    let congestionAvoidanceScore = 92;

    if (isPeakHour) {
      // Re-route around Benz Circle congestion via Vijayawada Bypass / Bandar Canal Road
      recommendedRouteName = 'Vijayawada Bypass & Inner Ring Road Diversion';
      estimatedDurationMinutes = 28; // slightly longer distance, but bypasses heavy gridlock
      estimatedDistanceKm = 21.0;
      congestionAvoidanceScore = 85;
    }

    return {
      originLat,
      originLng,
      destLat,
      destLng,
      departureTime: depDate.toISOString(),
      recommendedRouteName,
      estimatedDurationMinutes,
      estimatedDistanceKm,
      congestionAvoidanceScore,
      waypoints: [
        { latitude: originLat, longitude: originLng, name: 'Origin Pickup' },
        { latitude: 16.515, longitude: 80.655, name: 'Bypass Expressway Divergence' },
        { latitude: destLat, longitude: destLng, name: 'Destination Dropoff' },
      ],
    };
  }

  /**
   * Simulate EV battery degradation under Andhra Pradesh climatic conditions
   */
  simulateBatteryDegradation(
    vehicleId: string,
    batteryCapacityKwh = 40.0,
    currentOdometerKm = 35000,
    dcFastChargeFrequencyPercent = 60,
    averageAmbientTempCelsius = 38,
  ): BatteryDegradationSimulationDto {
    // Baseline degradation: ~1.5% loss per 20,000 km
    let degradation = (currentOdometerKm / 20000) * 1.5;

    // Thermal stress penalty (AP summer temperatures > 35°C accelerate degradation by 20%)
    if (averageAmbientTempCelsius > 35) {
      const thermalFactor = 1 + (averageAmbientTempCelsius - 35) * 0.05;
      degradation *= thermalFactor;
    }

    // High DC fast charging penalty (> 50% DC fast charging adds degradation)
    if (dcFastChargeFrequencyPercent > 50) {
      const fastChargeFactor = 1 + ((dcFastChargeFrequencyPercent - 50) / 100) * 0.25;
      degradation *= fastChargeFactor;
    }

    const projectedStateOfHealthPercent = Math.max(70.0, Math.round((100 - degradation) * 10) / 10);
    const estimatedRemainingCycles = Math.round((projectedStateOfHealthPercent / 100) * 2000);

    const recommendedChargingStrategy =
      dcFastChargeFrequencyPercent > 50
        ? 'Shift to overnight 7.4kW Type 2 AC charging at government fleet depots; restrict CCS2 DC fast charging to peak shifts only'
        : 'Current balanced AC/DC charging mix is optimal for AP climate';

    return {
      vehicleId,
      batteryCapacityKwh,
      currentOdometerKm,
      dcFastChargeFrequencyPercent,
      averageAmbientTempCelsius,
      projectedStateOfHealthPercent,
      estimatedRemainingCycles,
      recommendedChargingStrategy,
    };
  }
}
