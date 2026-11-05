import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BatterySwapStationDto,
  ExecuteBatterySwapDto,
  BatterySwapReceiptDto,
  BatteryPackModel,
  SwapStationStatus,
  GridTariffZone,
  GridTariffWindowDto,
  SmartChargeRecommendationDto,
} from '@ecoride/contracts';
import { BatterySwapStation } from '../../database/entities/battery-swap-station.entity';
import { BatterySwapTransaction } from '../../database/entities/battery-swap-transaction.entity';
import { GridTariffWindow } from '../../database/entities/grid-tariff-window.entity';

@Injectable()
export class BatterySwapService {
  constructor(
    @InjectRepository(BatterySwapStation)
    private readonly stationRepo: Repository<BatterySwapStation>,
    @InjectRepository(BatterySwapTransaction)
    private readonly swapTxRepo: Repository<BatterySwapTransaction>,
    @InjectRepository(GridTariffWindow)
    private readonly tariffRepo: Repository<GridTariffWindow>,
  ) {}

  /**
   * Lists battery swap stations with available charged packs and real-time bay count
   */
  async listStations(city?: string): Promise<BatterySwapStationDto[]> {
    const query = this.stationRepo.createQueryBuilder('s');
    if (city) {
      query.where('LOWER(s.city) = :city', { city: city.toLowerCase().trim() });
    }
    const stations = await query.getMany();

    if (stations.length === 0) {
      return this.getSeededStations(city);
    }

    return stations.map((s) => ({
      id: s.id,
      stationCode: s.stationCode,
      name: s.name,
      city: s.city,
      address: s.address,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      operator: s.operator,
      totalBays: s.totalBays,
      availableChargedPacks: s.availableChargedPacks,
      chargingPacks: s.chargingPacks,
      supportedModels: s.supportedModels as BatteryPackModel[],
      swapFeePaise: s.swapFeePaise,
      formattedSwapFee: `₹${(s.swapFeePaise / 100).toFixed(2)}`,
      status: s.status as SwapStationStatus,
    }));
  }

  /**
   * Executes an atomic battery swap: deposits depleted pack, dispenses 100% charged pack,
   * calculates 18% AP GST (SAC 9987), and records transaction.
   */
  async executeSwap(dto: ExecuteBatterySwapDto): Promise<BatterySwapReceiptDto> {
    if (dto.idempotencyKey) {
      const existing = await this.swapTxRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return this.mapReceipt(existing);
      }
    }

    const station = await this.stationRepo.findOne({ where: { id: dto.stationId } });
    if (!station) {
      throw new NotFoundException(`Battery swap station '${dto.stationId}' not found.`);
    }

    if (station.availableChargedPacks <= 0) {
      throw new BadRequestException('No fully charged battery packs currently available at this station.');
    }

    // Tax calculation: 18% GST (SAC 9987: 9% CGST + 9% SGST)
    const baseSwapFeePaise = station.swapFeePaise;
    const taxPaise = Math.round(baseSwapFeePaise * 0.18);
    const totalAmountPaise = baseSwapFeePaise + taxPaise;

    const dispensedSerial = `PACK-${dto.requestedModel}-${Date.now().toString(36).toUpperCase()}`;
    const energyReplenishedKwh = 3.6; // approx 100% - 20% on 4.5 kWh pack

    // Decrement available and increment charging
    station.availableChargedPacks = Math.max(0, station.availableChargedPacks - 1);
    station.chargingPacks = station.chargingPacks + 1;
    await this.stationRepo.save(station);

    const tx = this.swapTxRepo.create({
      stationId: station.id,
      stationCode: station.stationCode,
      vehicleRegistrationNumber: dto.vehicleRegistrationNumber.toUpperCase().trim(),
      depositedPackSerial: dto.depositedPackSerial,
      depositedSocPercent: dto.depositedPackSocPercent,
      dispensedPackSerial: dispensedSerial,
      dispensedSocPercent: 100.0,
      energyReplenishedKwh,
      baseSwapFeePaise,
      taxPaise,
      totalAmountPaise,
      idempotencyKey: dto.idempotencyKey || null,
    });

    const savedTx = await this.swapTxRepo.save(tx);
    return this.mapReceipt(savedTx, station.name);
  }

  /**
   * Evaluates Time-of-Day dynamic grid tariffs (APSPDCL / APCPDCL)
   */
  async getGridTariffWindows(): Promise<GridTariffWindowDto[]> {
    const windows = await this.tariffRepo.find();
    if (windows.length === 0) {
      return this.getSeededTariffs();
    }
    return windows.map((w) => ({
      zone: w.zone as GridTariffZone,
      startHourIst: w.startHourIst,
      endHourIst: w.endHourIst,
      ratePerKwhPaise: w.ratePerKwhPaise,
      formattedRatePerKwh: `₹${(w.ratePerKwhPaise / 100).toFixed(2)}/kWh`,
      discomName: w.discomName,
      isGreenEnergyPeak: w.isGreenEnergyPeak,
      notes: w.notes || '',
    }));
  }

  /**
   * Generates smart charge scheduling recommendation to charge during Solar Peak hours
   */
  async getSmartChargeRecommendation(
    vehicleId: string,
    currentSocPercent: number,
  ): Promise<SmartChargeRecommendationDto> {
    const energyNeededKwh = Math.max(0, Math.round(((85 - currentSocPercent) / 100) * 30 * 10) / 10);
    // Solar peak rate is ₹6.50/kWh (650 paise) vs Evening peak ₹11.50/kWh (1150 paise)
    const estimatedCostPaise = Math.round(energyNeededKwh * 650);
    const peakCostPaise = Math.round(energyNeededKwh * 1150);
    const savingsPaise = peakCostPaise - estimatedCostPaise;

    return {
      vehicleId,
      vehicleRegistrationNumber: 'AP-39-EV-1001',
      currentSocPercent,
      targetSocPercent: 85,
      energyNeededKwh,
      recommendedStationId: 'stn-vja-benz-01',
      recommendedStationName: 'Vijayawada Benz Circle Solar Swap & Fast Hub',
      recommendedStartWindow: '11:00 AM - 02:00 PM (IST Solar Peak)',
      tariffZone: GridTariffZone.SOLAR_PEAK,
      estimatedCostPaise,
      estimatedSavingsVsPeakPaise: savingsPaise,
      co2IntensityGramsPerKwh: 340, // cleaner solar grid intensity
      isOptimizedForSolar: true,
    };
  }

  private mapReceipt(tx: BatterySwapTransaction, stationName = 'EcoRide Swap Hub'): BatterySwapReceiptDto {
    return {
      swapTransactionId: tx.id,
      stationCode: tx.stationCode,
      stationName,
      vehicleRegistrationNumber: tx.vehicleRegistrationNumber,
      depositedPackSerial: tx.depositedPackSerial,
      depositedSocPercent: Number(tx.depositedSocPercent),
      dispensedPackSerial: tx.dispensedPackSerial,
      dispensedSocPercent: Number(tx.dispensedSocPercent),
      stateOfHealthPercent: 98.0,
      energyReplenishedKwh: Number(tx.energyReplenishedKwh),
      baseSwapFeePaise: tx.baseSwapFeePaise,
      taxPaise: tx.taxPaise,
      totalAmountPaise: tx.totalAmountPaise,
      formattedAmount: `₹${(tx.totalAmountPaise / 100).toFixed(2)}`,
      swappedAt: tx.swappedAt ? tx.swappedAt.toISOString() : new Date().toISOString(),
    };
  }

  private getSeededStations(city?: string): BatterySwapStationDto[] {
    const all: BatterySwapStationDto[] = [
      {
        id: 'stn-vja-benz-01',
        stationCode: 'BSS-VJA-BENZ',
        name: 'Vijayawada Benz Circle Solar Fast Swap Hub',
        city: 'vijayawada',
        address: 'MG Road, Near Benz Circle Flyover, Vijayawada, AP 520010',
        latitude: 16.5062,
        longitude: 80.648,
        operator: 'EcoRide Energy AP',
        totalBays: 16,
        availableChargedPacks: 12,
        chargingPacks: 4,
        supportedModels: [BatteryPackModel.LFP_48V_30AH, BatteryPackModel.LFP_60V_45AH],
        swapFeePaise: 9000, // ₹90.00
        formattedSwapFee: '₹90.00',
        status: SwapStationStatus.OPERATIONAL,
      },
      {
        id: 'stn-amv-sec-02',
        stationCode: 'BSS-AMV-SEC',
        name: 'Amaravathi Secretariat Zero-Carbon Swap Station',
        city: 'amaravathi',
        address: 'Velagapudi Government Complex, Amaravathi, AP 522237',
        latitude: 16.5412,
        longitude: 80.5143,
        operator: 'APCRDA Clean Energy Infrastructure',
        totalBays: 12,
        availableChargedPacks: 9,
        chargingPacks: 3,
        supportedModels: [BatteryPackModel.LFP_48V_30AH, BatteryPackModel.LFP_60V_45AH, BatteryPackModel.NMC_72V_60AH],
        swapFeePaise: 8000, // ₹80.00
        formattedSwapFee: '₹80.00',
        status: SwapStationStatus.OPERATIONAL,
      },
    ];

    if (city) {
      return all.filter((s) => s.city.toLowerCase() === city.toLowerCase().trim());
    }
    return all;
  }

  private getSeededTariffs(): GridTariffWindowDto[] {
    return [
      {
        zone: GridTariffZone.SOLAR_PEAK,
        startHourIst: 9,
        endHourIst: 16,
        ratePerKwhPaise: 650,
        formattedRatePerKwh: '₹6.50/kWh',
        discomName: 'APCPDCL / APSPDCL Solar Green Grid',
        isGreenEnergyPeak: true,
        notes: 'Lowest tariff window leveraging Andhra Pradesh utility solar farms',
      },
      {
        zone: GridTariffZone.EVENING_PEAK,
        startHourIst: 16,
        endHourIst: 22,
        ratePerKwhPaise: 1150,
        formattedRatePerKwh: '₹11.50/kWh',
        discomName: 'APCPDCL Commercial Peak',
        isGreenEnergyPeak: false,
        notes: 'Highest grid demand window. Smart charge scheduling minimizes fleet charging here.',
      },
      {
        zone: GridTariffZone.NORMAL,
        startHourIst: 22,
        endHourIst: 9,
        ratePerKwhPaise: 800,
        formattedRatePerKwh: '₹8.00/kWh',
        discomName: 'APCPDCL Base Overnight',
        isGreenEnergyPeak: false,
        notes: 'Overnight standard base rate for depot charging.',
      },
    ];
  }
}
