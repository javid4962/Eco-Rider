import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ColdChainExcursionClaim } from '../../database/entities/cold-chain-excursion-claim.entity';
import {
  ColdChainTelemetryDto,
  ColdChainCargoType,
  ExcursionClaimStatus,
} from '@ecoride/contracts';

interface TempThresholds {
  min: number;
  max: number;
}

@Injectable()
export class ColdChainInsuranceService {
  private readonly thresholds: Record<ColdChainCargoType, TempThresholds> = {
    [ColdChainCargoType.PHARMACEUTICAL_VACCINES]: { min: 2.0, max: 8.0 },
    [ColdChainCargoType.FROZEN_FOODS]: { min: -20.0, max: -15.0 },
    [ColdChainCargoType.FRESH_DAIRY_PRODUCE]: { min: 0.0, max: 4.0 },
  };

  constructor(
    @InjectRepository(ColdChainExcursionClaim)
    private readonly claimRepo: Repository<ColdChainExcursionClaim>,
  ) {}

  async processTelemetry(dto: ColdChainTelemetryDto): Promise<{
    status: ExcursionClaimStatus;
    claim?: ColdChainExcursionClaim;
    message: string;
  }> {
    const limits = this.thresholds[dto.cargoType] ?? { min: 0, max: 10 };
    const temp = dto.temperatureCelsius;
    const isExcursion = temp < limits.min || temp > limits.max;

    if (!isExcursion) {
      return {
        status: ExcursionClaimStatus.NORMAL,
        message: `Cargo temperature ${temp}°C is within optimal limits (${limits.min}°C to ${limits.max}°C).`,
      };
    }

    const claimRef = `CLM-EXC-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    // 80% coverage on declared value, up to max ₹500,000 (50,000,000 paise)
    const rawClaim = Math.round(Number(dto.declaredCargoValuePaise) * 0.8);
    const insuranceClaimAmountPaise = Math.min(rawClaim, 50000000);

    const claim = this.claimRepo.create({
      cargoTripId: dto.cargoTripId,
      vehicleId: dto.vehicleId,
      consignorId: dto.consignorId,
      cargoType: dto.cargoType,
      status: ExcursionClaimStatus.CLAIM_FILED,
      breachTemperatureCelsius: temp,
      minAllowedTempCelsius: limits.min,
      maxAllowedTempCelsius: limits.max,
      excursionDurationMinutes: 15,
      declaredValuePaise: String(dto.declaredCargoValuePaise),
      insuranceClaimAmountPaise,
      claimReferenceNumber: claimRef,
      filingReason: `Critical temperature breach: detected ${temp}°C vs threshold [${limits.min}°C, ${limits.max}°C] for ${dto.cargoType}`,
    });

    const saved = await this.claimRepo.save(claim);

    return {
      status: ExcursionClaimStatus.CLAIM_FILED,
      claim: saved,
      message: `Automated insurance claim filed: Ref ${claimRef} for ₹${(
        insuranceClaimAmountPaise / 100
      ).toFixed(2)}. Consignor notified.`,
    };
  }

  async getClaimByReference(claimReferenceNumber: string): Promise<ColdChainExcursionClaim> {
    const claim = await this.claimRepo.findOne({ where: { claimReferenceNumber } });
    if (!claim) {
      throw new NotFoundException(`Claim ${claimReferenceNumber} not found`);
    }
    return claim;
  }

  async settleClaim(claimReferenceNumber: string): Promise<ColdChainExcursionClaim> {
    const claim = await this.getClaimByReference(claimReferenceNumber);
    claim.status = ExcursionClaimStatus.CLAIM_SETTLED;
    return await this.claimRepo.save(claim);
  }
}

