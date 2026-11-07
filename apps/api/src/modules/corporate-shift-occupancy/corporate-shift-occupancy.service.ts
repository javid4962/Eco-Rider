import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CorporateShiftReconciliationEntity } from '../../database/entities/corporate-shift-reconciliation.entity';
import { ReconcileManifestRequest, RouteOccupancySummary } from '@ecoride/contracts';

@Injectable()
export class CorporateShiftOccupancyService {
  constructor(
    @InjectRepository(CorporateShiftReconciliationEntity)
    private readonly reconRepo: Repository<CorporateShiftReconciliationEntity>,
  ) {}

  async reconcileManifest(req: ReconcileManifestRequest): Promise<RouteOccupancySummary> {
    if (!req.manifestId || !req.routeId) {
      throw new BadRequestException('manifestId and routeId are required');
    }
    if (req.vehicleCapacity <= 0) {
      throw new BadRequestException('Vehicle capacity must be greater than 0');
    }

    const totalBoarded = req.actualBoardings.length;
    // Example: assumed scheduled target is baseline capacity or actual + absentees
    const totalScheduled = Math.max(totalBoarded, req.vehicleCapacity);
    const totalAbsent = Math.max(0, totalScheduled - totalBoarded);
    const occupancyRatePct = Math.round((totalBoarded / req.vehicleCapacity) * 100 * 10) / 10;
    const skippedStopsCount = totalAbsent > 0 ? Math.min(Math.floor(totalAbsent / 2), 3) : 0;

    let existing = await this.reconRepo.findOne({ where: { manifestId: req.manifestId } });
    if (!existing) {
      existing = this.reconRepo.create({
        manifestId: req.manifestId,
        routeId: req.routeId,
        totalScheduled,
        totalBoarded,
        totalAbsent,
        vehicleCapacity: req.vehicleCapacity,
        occupancyRatePct,
        skippedStopsCount,
      });
    } else {
      existing.totalBoarded = totalBoarded;
      existing.totalAbsent = totalAbsent;
      existing.occupancyRatePct = occupancyRatePct;
      existing.skippedStopsCount = skippedStopsCount;
    }

    const saved = await this.reconRepo.save(existing);

    return {
      manifestId: saved.manifestId,
      routeId: saved.routeId,
      totalScheduled: saved.totalScheduled,
      totalBoarded: saved.totalBoarded,
      totalAbsent: saved.totalAbsent,
      vehicleCapacity: saved.vehicleCapacity,
      occupancyRatePct: Number(saved.occupancyRatePct),
      skippedStopsCount: saved.skippedStopsCount,
      reconciledAt: saved.reconciledAt ? saved.reconciledAt.toISOString() : new Date().toISOString(),
    };
  }

  async getOccupancySummary(manifestId: string): Promise<RouteOccupancySummary> {
    const record = await this.reconRepo.findOne({ where: { manifestId } });
    if (!record) {
      throw new NotFoundException(`Manifest reconciliation for ${manifestId} not found`);
    }

    return {
      manifestId: record.manifestId,
      routeId: record.routeId,
      totalScheduled: record.totalScheduled,
      totalBoarded: record.totalBoarded,
      totalAbsent: record.totalAbsent,
      vehicleCapacity: record.vehicleCapacity,
      occupancyRatePct: Number(record.occupancyRatePct),
      skippedStopsCount: record.skippedStopsCount,
      reconciledAt: record.reconciledAt ? record.reconciledAt.toISOString() : new Date().toISOString(),
    };
  }
}

