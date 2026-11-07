export interface FreightManifestItem {
  sku: string;
  description: string;
  quantity: number;
  weightKg: number;
}

export interface FreightManifestHashRequest {
  manifestId: string;
  consignorGstin: string;
  consigneeGstin: string;
  originHub: string;
  destinationHub: string;
  vehicleId: string;
  propulsionType: 'BATTERY_ELECTRIC';
  items: FreightManifestItem[];
  batterySoCStartPct: number;
  estimatedKwhConsumption: number;
  ewayBillNumber: string;
}

export interface FreightManifestHashRecord {
  id: string;
  manifestId: string;
  consignorGstin: string;
  consigneeGstin: string;
  originHub: string;
  destinationHub: string;
  vehicleId: string;
  totalWeightKg: number;
  itemCount: number;
  batterySoCStartPct: number;
  merkleRootHash: string;
  cryptographicSignature: string;
  anchoredAt: string;
}

export interface FreightVerificationResult {
  manifestId: string;
  isValid: boolean;
  computedHash: string;
  storedHash: string;
  verifiedAt: string;
}

