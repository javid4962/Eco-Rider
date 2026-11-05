import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FreightManifestDto,
  CreateFreightManifestDto,
  FreightManifestStatus,
} from '@ecoride/contracts';
import { FreightManifest } from '../../database/entities/freight-manifest.entity';

@Injectable()
export class HubSpokeFreightService {
  constructor(
    @InjectRepository(FreightManifest)
    private readonly manifestRepo: Repository<FreightManifest>,
  ) {}

  /**
   * Generates hub-and-spoke freight manifest between AP freight logistics terminals
   */
  async createManifest(dto: CreateFreightManifestDto): Promise<FreightManifestDto> {
    const totalConsignments = dto.consignments.length;
    const grossWeightKg = dto.consignments.reduce((acc, c) => acc + c.weightKg, 0);
    const totalVolumeCft = dto.consignments.reduce((acc, c) => acc + c.volumeCubicFeet, 0);

    if (grossWeightKg > dto.payloadCapacityKg) {
      throw new BadRequestException(
        `Overweight freight rejected: Total gross ${grossWeightKg}kg exceeds vehicle rating of ${dto.payloadCapacityKg}kg`,
      );
    }

    const volumetricUtilization = Math.min(100.0, Math.round((totalVolumeCft / 250.0) * 1000) / 10);
    const manifestNumber = `MNF-${dto.originHubCode}-${dto.destinationHubCode}-${Date.now().toString(36).toUpperCase()}`;

    const entity = this.manifestRepo.create({
      manifestNumber,
      originHubCode: dto.originHubCode,
      destinationHubCode: dto.destinationHubCode,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber,
      captainId: dto.captainId,
      totalConsignments,
      grossWeightKg,
      payloadCapacityKg: dto.payloadCapacityKg,
      volumetricUtilizationPercent: volumetricUtilization,
      consignmentsData: dto.consignments,
      status: FreightManifestStatus.PLANNED,
    });

    const saved = await this.manifestRepo.save(entity);
    return this.mapToDto(saved);
  }

  async recordWeighbridgeCheck(manifestNumber: string, tareWeightKg: number, grossWeightKg: number): Promise<FreightManifestDto> {
    const manifest = await this.manifestRepo.findOne({ where: { manifestNumber } });
    if (!manifest) {
      throw new NotFoundException(`Manifest ${manifestNumber} not found`);
    }

    const netPayloadKg = grossWeightKg - tareWeightKg;
    if (netPayloadKg > Number(manifest.payloadCapacityKg) * 1.05) {
      // 5% statutory tare tolerance
      throw new BadRequestException(`Weighbridge alert: Net payload ${netPayloadKg}kg exceeds certified limit`);
    }

    manifest.weighbridgeTareWeightKg = tareWeightKg;
    manifest.weighbridgeGrossWeightKg = grossWeightKg;
    manifest.status = FreightManifestStatus.IN_TRANSIT;
    manifest.dispatchTime = new Date();

    const saved = await this.manifestRepo.save(manifest);
    return this.mapToDto(saved);
  }

  private mapToDto(m: FreightManifest): FreightManifestDto {
    return {
      id: m.id,
      manifestNumber: m.manifestNumber,
      originHubCode: m.originHubCode,
      destinationHubCode: m.destinationHubCode,
      vehicleRegistrationNumber: m.vehicleRegistrationNumber,
      captainId: m.captainId,
      totalConsignments: m.totalConsignments,
      grossWeightKg: Number(m.grossWeightKg),
      payloadCapacityKg: Number(m.payloadCapacityKg),
      volumetricUtilizationPercent: Number(m.volumetricUtilizationPercent),
      status: m.status as FreightManifestStatus,
      weighbridgeTareWeightKg: m.weighbridgeTareWeightKg ? Number(m.weighbridgeTareWeightKg) : undefined,
      weighbridgeGrossWeightKg: m.weighbridgeGrossWeightKg ? Number(m.weighbridgeGrossWeightKg) : undefined,
      dispatchTime: m.dispatchTime?.toISOString(),
      arrivalTime: m.arrivalTime?.toISOString(),
    };
  }
}

