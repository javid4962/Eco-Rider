/**
 * M87: High-Precision Carbon Credit Token Minting & Voluntary Carbon Market (VCM) Registry Export
 * Conversion of verified EV kilometers into standardized carbon offset credits.
 */

export interface CarbonCreditMintingBatchDto {
  batchIdentifier: string; // e.g. BATCH-AP-2026-Q1
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  totalElectricKm: number;
  avoidedCo2Kg: number; // statutory baseline vs ICE
  certifyingStandard: 'VERRA_VCS' | 'GOLD_STANDARD' | 'AP_GREEN_REGISTRY';
}

export interface MintedCarbonCreditBatchResult {
  batchId: string;
  batchIdentifier: string;
  totalCreditsMinted: number; // 1 credit = 1 metric ton (1,000 kg) avoided CO2
  fractionalKgCarriedForward: number;
  tokenSerialNumbers: string[]; // e.g. ['ECO-VCS-2026-0001', 'ECO-VCS-2026-0002']
  verificationHash: string;
  mintedAt: string;
  status: 'MINTED' | 'TRANSFERRED' | 'RETIRED';
}
