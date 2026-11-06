import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { InterDepotParcelRelay } from '../../database/entities/inter-depot-parcel-relay.entity';
import {
  CreateInterDepotRelayDto,
  RelayHandshakeVerificationDto,
  InterDepotRelayResult,
  RelayHopStatus,
} from '@ecoride/contracts';

@Injectable()
export class InterDepotRelayService {
  constructor(
    @InjectRepository(InterDepotParcelRelay)
    private readonly relayRepo: Repository<InterDepotParcelRelay>,
  ) {}

  async createRelay(dto: CreateInterDepotRelayDto): Promise<InterDepotRelayResult> {
    const token = `RELAY-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    const relay = this.relayRepo.create({
      consignmentId: dto.consignmentId,
      originLockerHubId: dto.originLockerHubId,
      transitDepotId: dto.transitDepotId,
      destinationLockerHubId: dto.destinationLockerHubId,
      courierVanVehicleId: dto.courierVanVehicleId,
      courierCaptainId: dto.courierCaptainId,
      weightGrams: dto.weightGrams,
      status: RelayHopStatus.SCHEDULED,
      currentLocationHub: dto.originLockerHubId,
      nextScheduledHub: dto.transitDepotId,
      verificationToken: token,
    });

    const saved = await this.relayRepo.save(relay);

    return {
      relayId: saved.id,
      consignmentId: saved.consignmentId,
      status: saved.status as RelayHopStatus,
      currentLocationHub: saved.currentLocationHub,
      nextScheduledHub: saved.nextScheduledHub,
      verificationToken: saved.verificationToken,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  async verifyHandshake(dto: RelayHandshakeVerificationDto): Promise<InterDepotRelayResult> {
    const relay = await this.relayRepo.findOne({ where: { id: dto.relayId } });
    if (!relay) {
      throw new NotFoundException(`Relay ${dto.relayId} not found`);
    }

    if (dto.otpCode.length !== 6) {
      throw new BadRequestException('Handshake transfer OTP must be exactly 6 digits');
    }

    if (relay.transitDepotId === dto.currentDepotId) {
      relay.status = RelayHopStatus.TRANSFERRED_TO_NEXT_HOP;
      relay.currentLocationHub = dto.currentDepotId;
      relay.nextScheduledHub = relay.destinationLockerHubId;
      relay.courierCaptainId = dto.receivedByCaptainId;
    } else if (relay.destinationLockerHubId === dto.currentDepotId) {
      relay.status = RelayHopStatus.DELIVERED_TO_DESTINATION_LOCKER;
      relay.currentLocationHub = dto.currentDepotId;
      relay.nextScheduledHub = 'FINAL_LOCKER_COMPARTMENT';
    } else {
      relay.status = RelayHopStatus.IN_TRANSIT;
      relay.currentLocationHub = dto.currentDepotId;
    }

    const updated = await this.relayRepo.save(relay);

    return {
      relayId: updated.id,
      consignmentId: updated.consignmentId,
      status: updated.status as RelayHopStatus,
      currentLocationHub: updated.currentLocationHub,
      nextScheduledHub: updated.nextScheduledHub,
      verificationToken: updated.verificationToken,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getRelay(id: string): Promise<InterDepotParcelRelay> {
    const r = await this.relayRepo.findOne({ where: { id } });
    if (!r) {
      throw new NotFoundException(`Relay ${id} not found`);
    }
    return r;
  }
}
