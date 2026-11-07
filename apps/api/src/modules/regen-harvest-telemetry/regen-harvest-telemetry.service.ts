import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegenHarvestLogEntity } from '../../database/entities/regen-harvest-log.entity';
import { IngestRegenTelemetryDto, RegenStatus } from '@ecoride/contracts';

@Injectable()
export class RegenHarvestTelemetryService {
  constructor(
    @InjectRepository(RegenHarvestLogEntity)
    private readonly regenRepo: Repository<RegenHarvestLogEntity>,
  ) {}

  async ingestRegenTelemetry(dto: IngestRegenTelemetryDto): Promise<RegenHarvestLogEntity> {
    let regenStatus = RegenStatus.OPTIMAL;
    let regenTorqueNm = 90.0;
    let energyRecuperatedWattHours = dto.descentDistanceMeters * (dto.slopeGradePercent / 100.0) * 1.5;

    if (dto.packSocPercent >= 98.0) {
      regenStatus = RegenStatus.CUTOFF_FULL_CHARGE;
      regenTorqueNm = 0.0;
      energyRecuperatedWattHours = 0.0;
    } else if (dto.cellMaxTemperatureC >= 48.0) {
      regenStatus = RegenStatus.THERMAL_THROTTLED;
      regenTorqueNm = 25.0;
      energyRecuperatedWattHours = energyRecuperatedWattHours * 0.3;
    } else if (dto.packSocPercent >= 90.0) {
      regenStatus = RegenStatus.LIMITED_HIGH_SOC;
      regenTorqueNm = 45.0;
      energyRecuperatedWattHours = energyRecuperatedWattHours * 0.5;
    }

    const log = this.regenRepo.create({
      vehicleId: dto.vehicleId,
      tripId: dto.tripId,
      corridorSegment: dto.corridorSegment,
      slopeGradePercent: dto.slopeGradePercent,
      descentDistanceMeters: dto.descentDistanceMeters,
      entrySpeedKmh: dto.entrySpeedKmh,
      exitSpeedKmh: dto.exitSpeedKmh,
      regenTorqueNm,
      energyRecuperatedWattHours: Math.round(energyRecuperatedWattHours * 100) / 100,
      packSocPercent: dto.packSocPercent,
      cellMaxTemperatureC: dto.cellMaxTemperatureC,
      regenStatus,
    });

    return this.regenRepo.save(log);
  }

  async getLog(id: string): Promise<RegenHarvestLogEntity> {
    const record = await this.regenRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Regen harvest log ${id} not found`);
    }
    return record;
  }
}
