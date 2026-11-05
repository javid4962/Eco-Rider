import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NhaiTollPlazaDto,
  TollCrossingRecordDto,
  IngestTollCrossingDto,
} from '@ecoride/contracts';
import { TollPlaza } from '../../database/entities/toll-plaza.entity';
import { TollCrossing } from '../../database/entities/toll-crossing.entity';

@Injectable()
export class HighwayTollService {
  constructor(
    @InjectRepository(TollPlaza)
    private readonly plazaRepo: Repository<TollPlaza>,
    @InjectRepository(TollCrossing)
    private readonly crossingRepo: Repository<TollCrossing>,
  ) {}

  private readonly initialPlazas: Partial<TollPlaza>[] = [
    {
      tollCode: 'AP_NH16_KAZA',
      name: 'Kaza Toll Plaza',
      highwayCode: 'NH-16 (Vijayawada - Guntur Corridor)',
      latitude: 16.425,
      longitude: 80.556,
      geofenceRadiusMeters: 300,
      carJeepVanTollPaise: 9500, // ₹95.00
      lightCommercialTollPaise: 15500, // ₹155.00
    },
    {
      tollCode: 'AP_NH16_POTTIPADU',
      name: 'Pottipadu Toll Plaza',
      highwayCode: 'NH-16 (Vijayawada - Eluru Corridor)',
      latitude: 16.632,
      longitude: 80.892,
      geofenceRadiusMeters: 300,
      carJeepVanTollPaise: 8500, // ₹85.00
      lightCommercialTollPaise: 14000, // ₹140.00
    },
  ];

  async getTollPlazas(): Promise<NhaiTollPlazaDto[]> {
    let plazas = await this.plazaRepo.find();
    if (plazas.length === 0) {
      for (const p of this.initialPlazas) {
        await this.plazaRepo.save(this.plazaRepo.create(p));
      }
      plazas = await this.plazaRepo.find();
    }

    return plazas.map((p) => ({
      id: p.id,
      tollCode: p.tollCode,
      name: p.name,
      highwayCode: p.highwayCode,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      geofenceRadiusMeters: p.geofenceRadiusMeters,
      carJeepVanTollPaise: p.carJeepVanTollPaise,
      lightCommercialTollPaise: p.lightCommercialTollPaise,
    }));
  }

  async ingestTollCrossing(dto: IngestTollCrossingDto): Promise<TollCrossingRecordDto> {
    const existing = await this.crossingRepo.findOne({ where: { fastagDeductionRef: dto.fastagDeductionRef } });
    if (existing) {
      return this.mapToDto(existing);
    }

    let plaza = await this.plazaRepo.findOne({ where: { tollCode: dto.tollPlazaCode } });
    if (!plaza) {
      const defaultPlaza = this.initialPlazas.find((p) => p.tollCode === dto.tollPlazaCode) || this.initialPlazas[0];
      plaza = await this.plazaRepo.save(this.plazaRepo.create(defaultPlaza));
    }

    const tollAmountPaise = plaza.carJeepVanTollPaise;
    const now = new Date();

    const entity = this.crossingRepo.create({
      bookingId: dto.bookingId,
      captainId: dto.captainId,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      tollPlazaCode: plaza.tollCode,
      tollPlazaName: plaza.name,
      tollAmountPaise,
      fastagDeductionRef: dto.fastagDeductionRef,
      reimbursementStatus: 'REIMBURSED',
      reimbursedAt: now,
    });

    const saved = await this.crossingRepo.save(entity);
    return this.mapToDto(saved);
  }

  private mapToDto(c: TollCrossing): TollCrossingRecordDto {
    return {
      id: c.id,
      bookingId: c.bookingId,
      captainId: c.captainId,
      vehicleRegistrationNumber: c.vehicleRegistrationNumber,
      tollPlazaCode: c.tollPlazaCode,
      tollPlazaName: c.tollPlazaName,
      tollAmountPaise: c.tollAmountPaise,
      fastagDeductionRef: c.fastagDeductionRef,
      reimbursementStatus: c.reimbursementStatus as 'PENDING' | 'REIMBURSED',
      reimbursedAt: c.reimbursedAt?.toISOString(),
      detectedAt: c.detectedAt.toISOString(),
    };
  }
}
