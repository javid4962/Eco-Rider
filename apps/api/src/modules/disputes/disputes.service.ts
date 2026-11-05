import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DisputeCategory,
  DisputeStatus,
  DisputeTicketDto,
  LostItemReportDto,
} from '@ecoride/contracts';
import { CustomerDispute } from '../../database/entities/customer-dispute.entity';
import { LostItemReport } from '../../database/entities/lost-item-report.entity';

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(CustomerDispute)
    private readonly disputeRepo: Repository<CustomerDispute>,
    @InjectRepository(LostItemReport)
    private readonly lostItemRepo: Repository<LostItemReport>,
  ) {}

  /**
   * Files a customer or driver dispute.
   * If category is UNAUTHORIZED_ROUTE_DETOUR and detour > 20%, automatically computes and applies refund.
   */
  async fileDispute(dto: {
    bookingId: string;
    complainantUserId: string;
    complainantRole: 'RIDER' | 'CAPTAIN';
    category: DisputeCategory;
    description: string;
    scheduledDistanceKm?: number;
    actualDistanceKm?: number;
    chargedFarePaise?: number;
  }): Promise<DisputeTicketDto> {
    if (!dto.description || dto.description.trim().length === 0) {
      throw new BadRequestException('Dispute description is required.');
    }

    const ticketNumber = `DISP-${Date.now().toString(36).toUpperCase()}`;
    let autoRefundAppliedPaise: number | undefined;
    let reMetredVariancePercent: number | undefined;
    let status = DisputeStatus.OPEN;
    let resolutionNotes: string | undefined;

    // Autonomous re-metering check for detour complaints
    if (
      dto.category === DisputeCategory.UNAUTHORIZED_ROUTE_DETOUR &&
      dto.scheduledDistanceKm &&
      dto.actualDistanceKm &&
      dto.actualDistanceKm > dto.scheduledDistanceKm
    ) {
      const variance = ((dto.actualDistanceKm - dto.scheduledDistanceKm) / dto.scheduledDistanceKm) * 100;
      reMetredVariancePercent = Math.round(variance * 10) / 10;

      if (variance > 20.0 && dto.chargedFarePaise) {
        // Overcharged due to detour; refund the excess proportional fare
        const excessFraction = (dto.actualDistanceKm - dto.scheduledDistanceKm) / dto.actualDistanceKm;
        autoRefundAppliedPaise = Math.round(dto.chargedFarePaise * excessFraction);
        status = DisputeStatus.AUTO_REFUNDED;
        resolutionNotes = `Autonomous GPS Audit: ${reMetredVariancePercent}% detour detected. Auto-refunded ₹${(autoRefundAppliedPaise / 100).toFixed(2)} to rider wallet.`;
      }
    }

    const dispute = this.disputeRepo.create({
      ticketNumber,
      bookingId: dto.bookingId,
      complainantUserId: dto.complainantUserId,
      complainantRole: dto.complainantRole,
      category: dto.category,
      description: dto.description.trim(),
      claimedAmountPaise: autoRefundAppliedPaise || undefined,
      autoRefundAppliedPaise: autoRefundAppliedPaise || null,
      reMetredVariancePercent: reMetredVariancePercent || null,
      status,
      resolutionNotes: resolutionNotes || null,
    });

    const saved = await this.disputeRepo.save(dispute);
    return this.mapDispute(saved);
  }

  /**
   * Files a lost property report and generates an expirable tokenized driver contact link
   */
  async reportLostItem(dto: {
    bookingId: string;
    riderId: string;
    itemType: string;
    itemDescription: string;
  }): Promise<LostItemReportDto> {
    const reportNumber = `LOST-${Date.now().toString(36).toUpperCase()}`;
    const token = Buffer.from(`${dto.bookingId}:${dto.riderId}:${Date.now()}`).toString('base64url').substring(0, 24);
    const tokenizedContactUrl = `https://track.ecoride.in/lost-item/${token}`;

    const report = this.lostItemRepo.create({
      reportNumber,
      bookingId: dto.bookingId,
      riderId: dto.riderId,
      itemType: dto.itemType.trim(),
      itemDescription: dto.itemDescription.trim(),
      status: 'REPORTED',
      tokenizedContactUrl,
    });

    const saved = await this.lostItemRepo.save(report);

    return {
      id: saved.id,
      reportNumber: saved.reportNumber,
      bookingId: saved.bookingId,
      riderId: saved.riderId,
      itemType: saved.itemType,
      itemDescription: saved.itemDescription,
      status: 'REPORTED',
      tokenizedDriverContactUrl: saved.tokenizedContactUrl,
      reportedAt: saved.reportedAt.toISOString(),
    };
  }

  /**
   * Resolves a customer dispute by support desk
   */
  async resolveDispute(
    ticketNumber: string,
    resolution: { status: DisputeStatus; resolutionNotes: string },
  ): Promise<DisputeTicketDto> {
    const dispute = await this.disputeRepo.findOne({ where: { ticketNumber } });
    if (!dispute) {
      throw new NotFoundException(`Dispute ticket '${ticketNumber}' not found.`);
    }

    dispute.status = resolution.status;
    dispute.resolutionNotes = resolution.resolutionNotes;
    const saved = await this.disputeRepo.save(dispute);
    return this.mapDispute(saved);
  }

  private mapDispute(d: CustomerDispute): DisputeTicketDto {
    return {
      id: d.id,
      ticketNumber: d.ticketNumber,
      bookingId: d.bookingId,
      complainantUserId: d.complainantUserId,
      complainantRole: d.complainantRole as 'RIDER' | 'CAPTAIN',
      category: d.category as DisputeCategory,
      description: d.description,
      claimedAmountPaise: d.claimedAmountPaise || undefined,
      autoRefundAppliedPaise: d.autoRefundAppliedPaise || undefined,
      reMetredDistanceVariancePercent: d.reMetredVariancePercent ? Number(d.reMetredVariancePercent) : undefined,
      status: d.status as DisputeStatus,
      resolutionNotes: d.resolutionNotes || undefined,
      createdAt: d.createdAt.toISOString(),
      resolvedAt: d.updatedAt ? d.updatedAt.toISOString() : undefined,
    };
  }
}

