import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoboticSwapSessionEntity } from '../../database/entities/robotic-swap-session.entity';
import {
  ExecuteRoboticSwapDto,
  RoboticSwapStep,
} from '@ecoride/contracts';

@Injectable()
export class RoboticSwapProtocolService {
  constructor(
    @InjectRepository(RoboticSwapSessionEntity)
    private readonly sessionRepo: Repository<RoboticSwapSessionEntity>,
  ) {}

  async executeRoboticSwap(dto: ExecuteRoboticSwapDto): Promise<RoboticSwapSessionEntity> {
    let currentStep = RoboticSwapStep.HANDSHAKE_COMPLETED;
    let isSuccessful = true;
    let faultCode: string | undefined = undefined;
    let durationSeconds = 95;

    if (!dto.canbusHandshakeOk) {
      currentStep = RoboticSwapStep.FAULT_ABORTED;
      isSuccessful = false;
      faultCode = 'ERR_CANBUS_HANDSHAKE_TIMEOUT';
      durationSeconds = 45;
    } else if (dto.lockingPinsEngagedCount < 4) {
      currentStep = RoboticSwapStep.FAULT_ABORTED;
      isSuccessful = false;
      faultCode = 'ERR_LOCKING_PINS_NOT_SEATED';
      durationSeconds = 65;
    } else if (dto.torqueNewtonMetersApplied < 40.0 || dto.torqueNewtonMetersApplied > 70.0) {
      currentStep = RoboticSwapStep.FAULT_ABORTED;
      isSuccessful = false;
      faultCode = 'ERR_TORQUE_OUT_OF_SPEC';
      durationSeconds = 80;
    }

    const session = this.sessionRepo.create({
      swapStationId: dto.swapStationId,
      bayNumber: dto.bayNumber,
      vehicleId: dto.vehicleId,
      depletedPackSerial: dto.depletedPackSerial,
      freshPackSerial: dto.freshPackSerial,
      currentStep,
      durationSeconds,
      torqueNewtonMetersApplied: dto.torqueNewtonMetersApplied,
      lockingPinsEngagedCount: dto.lockingPinsEngagedCount,
      canbusHandshakeOk: dto.canbusHandshakeOk,
      isSuccessful,
      faultCode,
      startedAt: new Date(),
      completedAt: new Date(),
    });

    return this.sessionRepo.save(session);
  }

  async getSession(id: string): Promise<RoboticSwapSessionEntity> {
    const record = await this.sessionRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Robotic swap session ${id} not found`);
    }
    return record;
  }
}

