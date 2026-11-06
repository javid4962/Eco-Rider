/**
 * M72: Autonomous Dynamic Geofence Congestion Surcharge & High-Density Roadway Pricing
 * Dynamic congestion surcharge calculations for dense traffic corridors in AP Capital Region.
 */

export interface CongestionZoneDefinition {
  zoneCode: string;
  zoneName: string;
  city: 'VIJAYAWADA' | 'GUNTUR' | 'AMARAVATHI' | 'MANGALAGIRI';
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  baseCongestionFeePaise: number; // e.g. 2500 paise (₹25.00)
  maxMultiplier: number; // e.g. 2.0
  activeHours: {
    startHourIST: number; // e.g. 8 (08:00 IST)
    endHourIST: number; // e.g. 11 (11:00 IST)
  }[];
}

export interface CalculateCongestionSurchargeDto {
  zoneCode: string;
  pickupLat: number;
  pickupLng: number;
  activeVehiclesCount: number;
  roadCongestionFactor: number; // 1.0 (free flow) to 3.0 (gridlock)
  hourIST?: number;
}

export interface CongestionSurchargeResult {
  zoneCode: string;
  isCongestionActive: boolean;
  congestionMultiplier: number;
  baseFeePaise: number;
  calculatedSurchargePaise: number;
  statutoryGstPaise: number; // 5% SAC 996412 for passenger transport
  totalSurchargeWithGstPaise: number;
  municipalContributionPaise: number; // 20% diverted to AP Green Urban Fund
}

