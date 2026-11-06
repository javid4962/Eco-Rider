/**
 * M89: Multi-Tenant University & Hospital Campus Automated Zero-Emission Shuttle Scheduling
 * High-frequency loops for AIIMS Mangalagiri, SRM University AP, and VIT-AP.
 */

export interface CampusShuttleScheduleDto {
  campusCode: 'AIIMS_MANGALAGIRI' | 'SRM_UNIVERSITY_AP' | 'VIT_AP_AMARAVATHI';
  loopName: string; // e.g. 'Outpatient to Medical College Express'
  vehicleType: 'VAN_COMMUTE_4W' | 'CAB_PRIVATE_4W';
  operatingFrequencyMinutes: number; // e.g. every 10 mins
  firstDepartureTime: string; // '07:30'
  lastDepartureTime: string; // '21:30'
  farePerRidePaise: number; // ₹15 (1,500 paise) subsidized or flat
  designatedStops: string[];
}

export interface CampusLoopBookingDto {
  studentOrStaffId: string;
  campusCode: string;
  scheduleId: string;
  pickupStop: string;
  dropStop: string;
  rfidCardUid?: string;
}

export interface CampusLoopBookingResult {
  bookingId: string;
  campusCode: string;
  assignedVehicleNumber: string;
  etaMinutes: number;
  fareChargedPaise: number;
  boardingPassQrToken: string;
  status: 'CONFIRMED' | 'BOARDED' | 'COMPLETED';
}
