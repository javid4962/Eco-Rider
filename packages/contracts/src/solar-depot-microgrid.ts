export type MicrogridPowerSource = 'GRID' | 'SOLAR_BESS' | 'HYBRID';

export interface SolarDepotMicrogridReading {
  depotId: string;
  solarGenerationKw: number;
  depotBessSocPct: number;
  gridDemandTariffPaisePerKwh: number; // e.g. 950 during peak, 450 during off-peak
  totalChargingLoadKw: number;
}

export interface MicrogridPeakShavingDispatch {
  id?: string;
  depotId: string;
  sourceMode: MicrogridPowerSource;
  gridDrawKw: number;
  solarBessDrawKw: number;
  peakShavedKw: number;
  arbitrageSavingsPaise: number;
  isPeakPeriod: boolean;
  timestamp: string;
}

