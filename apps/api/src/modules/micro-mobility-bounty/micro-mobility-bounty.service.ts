import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroMobilityBounty } from '../../database/entities/micro-mobility-bounty.entity';
import {
  BountyStatus,
  NoParkingZoneCode,
  VerifyDockingLocationDto,
  DockingValidationResult,
  ClaimBountyDto,
  CompleteBountyRedockDto,
  BountySettlementResult,
} from '@ecoride/contracts';

@Injectable()
export class MicroMobilityBountyService {
  constructor(
    @InjectRepository(MicroMobilityBounty)
    private readonly bountyRepo: Repository<MicroMobilityBounty>,
  ) {}

  async validateDockingLocation(dto: VerifyDockingLocationDto): Promise<DockingValidationResult> {
    const zone = this.detectNoParkingZone(dto.latitude, dto.longitude);

    if (zone) {
      // Illegal drop-off inside no-parking zone
      const penaltyFeePaise = 15000; // ₹150 penalty
      const rewardPaise = 7500;      // ₹75 retrieval reward

      const bounty = this.bountyRepo.create({
        vehicleId: dto.vehicleId,
        sessionId: dto.sessionId,
        zoneCode: zone,
        abandonedLatitude: dto.latitude,
        abandonedLongitude: dto.longitude,
        bountyRewardPaise: rewardPaise,
        status: BountyStatus.OPEN,
      });

      await this.bountyRepo.save(bounty);

      return {
        vehicleId: dto.vehicleId,
        isAllowedToLock: false,
        isInNoParkingZone: true,
        zoneCode: zone,
        penaltyFeePaise,
        bountyCreated: true,
        message: `Vehicle abandoned in prohibited No-Parking Zone (${zone}). ₹150 penalty levied and retrieval bounty posted.`,
      };
    }

    return {
      vehicleId: dto.vehicleId,
      isAllowedToLock: true,
      isInNoParkingZone: false,
      penaltyFeePaise: 0,
      bountyCreated: false,
      message: 'Authorized parking zone. Ride session can be locked safely.',
    };
  }

  async claimBounty(dto: ClaimBountyDto): Promise<MicroMobilityBounty> {
    const bounty = await this.bountyRepo.findOne({ where: { id: dto.bountyId } });
    if (!bounty) {
      throw new NotFoundException('Bounty not found');
    }
    if (bounty.status !== BountyStatus.OPEN) {
      throw new BadRequestException(`Bounty cannot be claimed: status is ${bounty.status}`);
    }

    bounty.claimedByCaptainId = dto.captainId;
    bounty.status = BountyStatus.CLAIMED;
    return this.bountyRepo.save(bounty);
  }

  async completeBountyRedock(dto: CompleteBountyRedockDto): Promise<BountySettlementResult> {
    const bounty = await this.bountyRepo.findOne({ where: { id: dto.bountyId } });
    if (!bounty) {
      throw new NotFoundException('Bounty not found');
    }
    if (bounty.claimedByCaptainId !== dto.captainId) {
      throw new BadRequestException('Captain mismatch: bounty was not claimed by this captain');
    }
    if (bounty.status !== BountyStatus.CLAIMED) {
      throw new BadRequestException(`Bounty must be in CLAIMED state to complete redocking (current: ${bounty.status})`);
    }

    const completedAt = new Date();
    bounty.dockedHubId = dto.dockedHubId;
    bounty.status = BountyStatus.VERIFIED_REDOCKED;
    bounty.completedAt = completedAt;
    const updated = await this.bountyRepo.save(bounty);

    return {
      bountyId: updated.id,
      vehicleId: updated.vehicleId,
      captainId: updated.claimedByCaptainId!,
      rewardPaise: Number(updated.bountyRewardPaise),
      status: updated.status,
      completedAt: (updated.completedAt ?? completedAt).toISOString(),
    };
  }

  private detectNoParkingZone(lat: number, lon: number): NoParkingZoneCode | null {
    // Benz Circle Flyover
    if (lat >= 16.495 && lat <= 16.505 && lon >= 80.645 && lon <= 80.655) {
      return NoParkingZoneCode.BENZ_CIRCLE_FLYOVER;
    }
    // Prakasam Barrage Pedestrian
    if (lat >= 16.505 && lat <= 16.515 && lon >= 80.600 && lon <= 80.615) {
      return NoParkingZoneCode.PRAKASAM_BARRAGE_PEDESTRIAN;
    }
    // AIIMS Emergency Corridor
    if (lat >= 16.435 && lat <= 16.445 && lon >= 80.570 && lon <= 80.585) {
      return NoParkingZoneCode.AIIMS_EMERGENCY_CORRIDOR;
    }
    return null;
  }
}
