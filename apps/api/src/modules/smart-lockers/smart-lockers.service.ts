import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  DepositParcelDto,
  RetrieveParcelDto,
  LockerOperationResultDto,
  LockerCompartmentStatus,
} from '@ecoride/contracts';
import { SmartLockerCompartment } from '../../database/entities/smart-locker-compartment.entity';
import { LockerAccessLog } from '../../database/entities/locker-access-log.entity';

@Injectable()
export class SmartLockersService {
  constructor(
    @InjectRepository(SmartLockerCompartment)
    private readonly compartmentRepo: Repository<SmartLockerCompartment>,
    @InjectRepository(LockerAccessLog)
    private readonly logRepo: Repository<LockerAccessLog>,
  ) {}

  async depositParcel(dto: DepositParcelDto): Promise<LockerOperationResultDto> {
    const compartment = await this.compartmentRepo.findOne({
      where: {
        lockerHubId: dto.lockerHubId,
        size: dto.size,
        status: LockerCompartmentStatus.AVAILABLE,
      },
    });

    if (!compartment) {
      throw new NotFoundException(
        `No available compartment of size ${dto.size} at locker hub ${dto.lockerHubId}`,
      );
    }

    const releaseOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const releaseOtpHashed = crypto.createHash('sha256').update(releaseOtp).digest('hex');

    compartment.status = LockerCompartmentStatus.OCCUPIED;
    compartment.currentConsignmentId = dto.consignmentId;
    compartment.releaseOtpHash = releaseOtpHashed;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48-hour pickup window
    compartment.expiresAt = expiresAt;

    await this.compartmentRepo.save(compartment);

    const log = this.logRepo.create({
      lockerHubId: dto.lockerHubId,
      compartmentNumber: compartment.compartmentNumber,
      action: 'DEPOSIT',
      actorPhone: dto.riderPhone,
      success: true,
    });
    await this.logRepo.save(log);

    return {
      success: true,
      compartmentNumber: compartment.compartmentNumber,
      message: `Parcel ${dto.consignmentId} deposited into compartment ${compartment.compartmentNumber}. Release OTP: ${releaseOtp}`,
      doorUnlocked: true,
      timestamp: new Date().toISOString(),
    };
  }

  async retrieveParcel(dto: RetrieveParcelDto): Promise<LockerOperationResultDto> {
    const compartment = await this.compartmentRepo.findOne({
      where: {
        lockerHubId: dto.lockerHubId,
        compartmentNumber: dto.compartmentNumber,
      },
    });

    if (!compartment || compartment.status !== LockerCompartmentStatus.OCCUPIED) {
      throw new NotFoundException(
        `Compartment ${dto.compartmentNumber} at hub ${dto.lockerHubId} is not currently holding an occupied consignment`,
      );
    }

    const inputHash = crypto.createHash('sha256').update(dto.releaseOtp).digest('hex');
    if (compartment.releaseOtpHash !== inputHash) {
      const failLog = this.logRepo.create({
        lockerHubId: dto.lockerHubId,
        compartmentNumber: dto.compartmentNumber,
        action: 'RETRIEVE_FAILED',
        actorPhone: null,
        success: false,
      });
      await this.logRepo.save(failLog);
      throw new BadRequestException('Invalid parcel release OTP');
    }

    compartment.status = LockerCompartmentStatus.AVAILABLE;
    compartment.currentConsignmentId = null;
    compartment.releaseOtpHash = null;
    compartment.expiresAt = null;

    await this.compartmentRepo.save(compartment);

    const log = this.logRepo.create({
      lockerHubId: dto.lockerHubId,
      compartmentNumber: dto.compartmentNumber,
      action: 'RETRIEVE',
      actorPhone: null,
      success: true,
    });
    await this.logRepo.save(log);

    return {
      success: true,
      compartmentNumber: dto.compartmentNumber,
      message: `Compartment ${dto.compartmentNumber} door unlocked. Parcel retrieved successfully.`,
      doorUnlocked: true,
      timestamp: new Date().toISOString(),
    };
  }
}

