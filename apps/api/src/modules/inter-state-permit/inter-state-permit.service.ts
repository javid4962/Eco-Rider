import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterStatePermitPassEntity } from '../../database/entities/inter-state-permit-pass.entity';
import {
  ValidateInterStatePermitDto,
  InterStatePermitStatus,
} from '@ecoride/contracts';

@Injectable()
export class InterStatePermitService {
  constructor(
    @InjectRepository(InterStatePermitPassEntity)
    private readonly passRepo: Repository<InterStatePermitPassEntity>,
  ) {}

  async validatePermit(dto: ValidateInterStatePermitDto): Promise<InterStatePermitPassEntity> {
    let status = InterStatePermitStatus.VALID_RECIPROCAL;
    let isClearedForBorderTransit = true;
    const borderTollDeductionPaise = 15000; // ₹150 NH65 standard EV corridor toll
    let fastagDeducted = false;

    if (!dto.hasGreenCommercialPlate) {
      status = InterStatePermitStatus.EXPIRED_BLOCKED;
      isClearedForBorderTransit = false;
    } else if (!dto.isReciprocalAgreementActive) {
      status = InterStatePermitStatus.BORDER_TEMP_PASS;
      isClearedForBorderTransit = true;
    }

    if (isClearedForBorderTransit && dto.fastagBalancePaise >= borderTollDeductionPaise) {
      fastagDeducted = true;
    }

    const transitManifestId = `MANIFEST-AP-TG-${Date.now().toString(36).toUpperCase()}`;

    const record = this.passRepo.create({
      vehicleId: dto.vehicleId,
      corridor: dto.corridor,
      permitNumber: dto.permitNumber,
      status,
      isClearedForBorderTransit,
      borderTollDeductionPaise: fastagDeducted ? borderTollDeductionPaise : 0,
      fastagDeducted,
      interStateTransitManifestId: transitManifestId,
      issuedAt: new Date(),
    });

    return this.passRepo.save(record);
  }

  async getPass(id: string): Promise<InterStatePermitPassEntity> {
    const record = await this.passRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Inter-state permit pass ${id} not found`);
    }
    return record;
  }
}

