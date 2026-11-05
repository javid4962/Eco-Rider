export interface NhaiTollPlazaDto {
  id: string;
  tollCode: string;
  name: string;
  highwayCode: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  carJeepVanTollPaise: number;
  lightCommercialTollPaise: number;
}

export interface TollCrossingRecordDto {
  id: string;
  bookingId: string;
  captainId: string;
  vehicleRegistrationNumber: string;
  tollPlazaCode: string;
  tollPlazaName: string;
  tollAmountPaise: number;
  fastagDeductionRef: string;
  reimbursementStatus: 'PENDING' | 'REIMBURSED';
  reimbursedAt?: string;
  detectedAt: string;
}

export interface IngestTollCrossingDto {
  bookingId: string;
  captainId: string;
  vehicleRegistrationNumber: string;
  tollPlazaCode: string;
  fastagDeductionRef: string;
}

