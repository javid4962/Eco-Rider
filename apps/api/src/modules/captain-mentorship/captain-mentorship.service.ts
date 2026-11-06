import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptainMentorshipPairing } from '../../database/entities/captain-mentorship-pairing.entity';
import {
  CreateMentorshipPairingDto,
  UpdateMentorshipProgressDto,
  MentorshipGraduationResult,
  MentorshipStatus,
} from '@ecoride/contracts';

@Injectable()
export class CaptainMentorshipService {
  constructor(
    @InjectRepository(CaptainMentorshipPairing)
    private readonly pairingRepo: Repository<CaptainMentorshipPairing>,
  ) {}

  async createPairing(dto: CreateMentorshipPairingDto): Promise<CaptainMentorshipPairing> {
    if (dto.mentorTier !== 'GOLD' && dto.mentorTier !== 'PLATINUM') {
      throw new BadRequestException(
        'Only GOLD or PLATINUM tier captains are eligible to mentor recruits in Andhra Pradesh',
      );
    }

    if (dto.mentorCaptainId === dto.menteeCaptainId) {
      throw new BadRequestException('A captain cannot mentor themselves');
    }

    const pairing = this.pairingRepo.create({
      mentorCaptainId: dto.mentorCaptainId,
      mentorTier: dto.mentorTier,
      menteeCaptainId: dto.menteeCaptainId,
      status: MentorshipStatus.ACTIVE,
      targetTrips: dto.targetTrips ?? 100,
      completedTrips: 0,
      minimumRating: dto.minimumRating ?? 4.85,
      currentRating: 5.0,
      bonusAmountPaise: dto.bonusAmountPaise ?? 250000, // ₹2,500
    });

    return await this.pairingRepo.save(pairing);
  }

  async updateProgress(
    pairingId: string,
    dto: UpdateMentorshipProgressDto,
  ): Promise<CaptainMentorshipPairing> {
    const pairing = await this.pairingRepo.findOne({ where: { id: pairingId } });
    if (!pairing) {
      throw new NotFoundException(`Mentorship pairing with ID ${pairingId} not found`);
    }

    if (pairing.status !== MentorshipStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot update progress for pairing with status ${pairing.status}`,
      );
    }

    if (dto.tripsIncrement) {
      pairing.completedTrips += dto.tripsIncrement;
    }

    if (dto.newRating !== undefined) {
      pairing.currentRating = dto.newRating;
    }

    return await this.pairingRepo.save(pairing);
  }

  async evaluateGraduation(pairingId: string): Promise<MentorshipGraduationResult> {
    const pairing = await this.pairingRepo.findOne({ where: { id: pairingId } });
    if (!pairing) {
      throw new NotFoundException(`Mentorship pairing with ID ${pairingId} not found`);
    }

    const tripsMet = pairing.completedTrips >= pairing.targetTrips;
    const ratingMet = Number(pairing.currentRating) >= Number(pairing.minimumRating);

    if (tripsMet && ratingMet) {
      pairing.status = MentorshipStatus.GRADUATED;
      pairing.disbursedAt = new Date();
      await this.pairingRepo.save(pairing);

      const txnId = `TXN-MENTOR-${pairing.id.substring(0, 8).toUpperCase()}-${Date.now()}`;

      return {
        pairingId: pairing.id,
        status: MentorshipStatus.GRADUATED,
        isGraduated: true,
        bonusDisbursedPaise: pairing.bonusAmountPaise,
        ledgerTransactionId: txnId,
        message: `Mentee successfully graduated! Bonus of ₹${(
          pairing.bonusAmountPaise / 100
        ).toFixed(2)} disbursed to mentor ${pairing.mentorCaptainId}.`,
      };
    }

    return {
      pairingId: pairing.id,
      status: pairing.status as MentorshipStatus,
      isGraduated: false,
      bonusDisbursedPaise: 0,
      message: `Probation ongoing: ${pairing.completedTrips}/${pairing.targetTrips} trips, rating ${pairing.currentRating}/${pairing.minimumRating}.`,
    };
  }

  async getPairingsForMentor(mentorCaptainId: string): Promise<CaptainMentorshipPairing[]> {
    return await this.pairingRepo.find({ where: { mentorCaptainId } });
  }
}

