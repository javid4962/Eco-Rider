export interface ApStaComplianceSummaryDto {
  reportPeriod: string;
  stateTransportAuthority: 'AP_STA';
  stateCode: '37';
  jurisdiction: 'Vijayawada, Guntur, Amaravathi, Mangalagiri';
  totalActiveCommercialEvs: number;
  totalElectricTripsCompleted: number;
  totalZeroEmissionKilometers: number;
  totalTailpipeCo2AvoidedKg: number;
  iceVehiclesExcludedCount: number;
  statutoryGstRemittedPaise: number;
  digitalSignatureSha256: string;
  generatedAt: string;
}

export interface RegulatoryFeedFilterDto {
  city?: string;
  fromDate?: string;
  toDate?: string;
}

