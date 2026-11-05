export interface CampusGeofenceDto {
  id: string;
  campusCode: string;
  campusName: string;
  city: string;
  boundaryGeoJson: Record<string, any>;
  authorizedOrganizations: string[];
  totalShuttlesActive: number;
  operatingHours: string;
}

export interface CampusShuttleLoopDto {
  id: string;
  campusCode: string;
  loopName: string;
  headwayMinutes: number;
  stops: { name: string; sequence: number; lat: number; lng: number }[];
  currentVehicleReg?: string;
  nextDepartureEstimateMinutes: number;
}

export interface CampusBoardingPassDto {
  passId: string;
  campusCode: string;
  employeeOrStudentId: string;
  holderName: string;
  department: string;
  qrPayload: string;
  status: 'ACTIVE' | 'EXPIRED';
}

