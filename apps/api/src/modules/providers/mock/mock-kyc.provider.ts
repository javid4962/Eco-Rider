import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  IKycProvider,
  AadhaarVerifyRequest,
  AadhaarVerifyResult,
  DrivingLicenseVerifyRequest,
  DrivingLicenseVerifyResult,
  VehicleRcVerifyRequest,
  VehicleRcVerifyResult,
} from '../interfaces/kyc-provider.interface';

@Injectable()
export class MockKycProvider implements IKycProvider {
  private readonly logger = new Logger(MockKycProvider.name);

  /**
   * Verifies an Aadhaar number, masks first 8 digits, and validates adult age.
   */
  async verifyAadhaar(request: AadhaarVerifyRequest): Promise<AadhaarVerifyResult> {
    const rawNumber = (request.aadhaarNumber || '').replace(/\s+/g, '');

    if (!/^\d{12}$/.test(rawNumber)) {
      throw new BadRequestException('Aadhaar must be a 12-digit numeric identifier');
    }

    // Mask first 8 digits per UIDAI privacy guidelines
    const maskedAadhaar = `XXXXXXXX${rawNumber.substring(8)}`;
    const referenceId = `aadhaar_ref_${randomUUID().substring(0, 10)}`;

    // Rejection rule for synthetic test cases (e.g. numbers ending in 0000 are rejected as invalid)
    if (rawNumber.endsWith('0000')) {
      return {
        verified: false,
        maskedAadhaar,
        isAdult: false,
        referenceId,
        rejectionReason: 'Aadhaar biometric / demographic verification failed with UIDAI',
      };
    }

    // Rejection rule for minors (< 18 years old test case: ending with 9999)
    if (rawNumber.endsWith('9999')) {
      return {
        verified: false,
        maskedAadhaar,
        isAdult: false,
        yearOfBirth: 2015,
        state: 'Andhra Pradesh',
        referenceId,
        rejectionReason: 'Applicant does not meet minimum age requirement (18 years)',
      };
    }

    this.logger.log(`[MockKycProvider] Verified Aadhaar ${maskedAadhaar} (Ref: ${referenceId})`);

    return {
      verified: true,
      maskedAadhaar,
      nameMatches: true,
      gender: 'M',
      yearOfBirth: 1995,
      state: 'Andhra Pradesh',
      isAdult: true,
      referenceId,
    };
  }

  /**
   * Verifies a commercial driving license for Andhra Pradesh transport.
   */
  async verifyDrivingLicense(
    request: DrivingLicenseVerifyRequest,
  ): Promise<DrivingLicenseVerifyResult> {
    const dlNumber = (request.dlNumber || '').trim().toUpperCase();

    if (!dlNumber || dlNumber.length < 8) {
      throw new BadRequestException('Invalid Driving License format');
    }

    const referenceId = `dl_ref_${randomUUID().substring(0, 10)}`;

    // Synthetic test rejection: expired license
    if (dlNumber.includes('EXP')) {
      return {
        verified: false,
        dlNumber,
        isExpired: true,
        isCommercialPermitted: false,
        vehicleClasses: ['LMV-TR'],
        validUntil: '2023-01-01',
        referenceId,
        rejectionReason: 'Driving License has expired. Renewal required.',
      };
    }

    // Synthetic test rejection: non-commercial private-only license
    if (dlNumber.includes('NONCOMM')) {
      return {
        verified: false,
        dlNumber,
        isExpired: false,
        isCommercialPermitted: false,
        vehicleClasses: ['LMV-NT'],
        validUntil: '2035-12-31',
        referenceId,
        rejectionReason: 'License lacks commercial transport endorsement (LMV-TR / TRANS).',
      };
    }

    this.logger.log(`[MockKycProvider] Verified Driving License ${dlNumber} (Ref: ${referenceId})`);

    return {
      verified: true,
      dlNumber,
      holderName: 'Verified Captain',
      validUntil: '2030-12-31',
      vehicleClasses: ['MCWG', 'LMV-TR', 'TRANS'],
      isCommercialPermitted: true,
      isExpired: false,
      referenceId,
    };
  }

  /**
   * Verifies vehicle Registration Certificate (RC) and strictly enforces EV-only propulsion.
   */
  async verifyRc(request: VehicleRcVerifyRequest): Promise<VehicleRcVerifyResult> {
    const regNumber = (request.registrationNumber || '').trim().toUpperCase();

    if (!regNumber) {
      throw new BadRequestException('Vehicle registration number is required');
    }

    const referenceId = `rc_ref_${randomUUID().substring(0, 10)}`;

    // Check propulsion: strictly BATTERY ELECTRIC
    // Synthetic rejection if reg number indicates ICE or hybrid
    if (
      regNumber.includes('PETROL') ||
      regNumber.includes('DIESEL') ||
      regNumber.includes('CNG') ||
      regNumber.includes('HYBRID')
    ) {
      this.logger.warn(
        `[MockKycProvider] REJECTED non-EV vehicle registration attempt: ${regNumber}`,
      );
      return {
        verified: false,
        registrationNumber: regNumber,
        fuelType: regNumber.includes('PETROL')
          ? 'PETROL'
          : regNumber.includes('DIESEL')
            ? 'DIESEL'
            : regNumber.includes('CNG')
              ? 'CNG'
              : 'HYBRID',
        isElectric: false,
        vehicleClass: 'MOTOR_CAB',
        registrationState: 'AP',
        referenceId,
        rejectionReason:
          'EcoRide mobility platform strictly prohibits ICE/Hybrid propulsion. Only 100% Battery Electric Vehicles (BEV) are permitted.',
      };
    }

    this.logger.log(`[MockKycProvider] Verified BEV Vehicle RC ${regNumber} (Ref: ${referenceId})`);

    return {
      verified: true,
      registrationNumber: regNumber,
      fuelType: 'ELECTRIC',
      isElectric: true,
      vehicleClass: regNumber.includes('3W') ? '3W-COMMERCIAL' : '4W-CAB',
      registrationState: 'AP',
      fitnessValidUntil: '2028-12-31',
      insuranceValidUntil: '2027-12-31',
      referenceId,
    };
  }
}

