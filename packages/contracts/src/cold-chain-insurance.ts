/**
 * M73: Cold-Chain Autonomous Temperature Excursion Automated Cargo Insurance Claim Dispatch
 * Telematics monitoring for perishable/pharma EV cargo with automated insurance claim filing.
 */

export enum ColdChainCargoType {
  PHARMACEUTICAL_VACCINES = 'PHARMACEUTICAL_VACCINES', // +2°C to +8°C
  FROZEN_FOODS = 'FROZEN_FOODS',                       // -20°C to -15°C
  FRESH_DAIRY_PRODUCE = 'FRESH_DAIRY_PRODUCE',         // 0°C to +4°C
}

export enum ExcursionClaimStatus {
  NORMAL = 'NORMAL',
  EXCURSION_DETECTED = 'EXCURSION_DETECTED',
  CLAIM_FILED = 'CLAIM_FILED',
  CLAIM_SETTLED = 'CLAIM_SETTLED',
  DISMISSED = 'DISMISSED',
}

export interface ColdChainTelemetryDto {
  cargoTripId: string;
  vehicleId: string;
  cargoType: ColdChainCargoType;
  temperatureCelsius: number;
  humidityPercent: number;
  ambientTemperatureCelsius: number;
  latitude: number;
  longitude: number;
  consignorId: string;
  declaredCargoValuePaise: number;
  timestamp: string;
}

export interface ColdChainExcursionClaim {
  id: string;
  cargoTripId: string;
  vehicleId: string;
  cargoType: ColdChainCargoType;
  status: ExcursionClaimStatus;
  breachTemperatureCelsius: number;
  minAllowedTempCelsius: number;
  maxAllowedTempCelsius: number;
  excursionDurationMinutes: number;
  declaredValuePaise: number;
  insuranceClaimAmountPaise: number; // e.g. 80% coverage
  claimReferenceNumber: string;
  filingReason: string;
  createdAt: string;
}

