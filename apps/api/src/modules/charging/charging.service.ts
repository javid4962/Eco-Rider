import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ChargingStation } from '../../database/entities/charging-station.entity';
import { ChargingReservation } from '../../database/entities/charging-reservation.entity';
import { BatteryTelemetryLog } from '../../database/entities/battery-telemetry-log.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import {
  ChargingStationStatus,
  ChargingReservationStatus,
  ChargingStationDto,
  NearbyChargerQueryDto,
  CreateChargingReservationDto,
  ChargingReservationDto,
  CompleteChargingSessionDto,
  BatteryTelemetryReportDto,
  BatteryTelemetryResponseDto,
  AP_CAPITAL_CORRIDOR_CHARGERS,
  PropulsionType,
  ApiErrorCode,
} from '@ecoride/contracts';

@Injectable()
export class ChargingService {
  private readonly logger = new Logger(ChargingService.name);

  // Critical safety thresholds for EV fleet dispatch
  private readonly HARD_LOCKOUT_SOC_PERCENT = 18.0;
  private readonly LOW_BATTERY_WARNING_SOC_PERCENT = 25.0;
  private readonly MIN_SAFE_RANGE_KM = 10.0;
  private readonly RESERVATION_HOLD_MINUTES = 15;
  private readonly CHARGING_GST_RATE = 0.18; // 18% GST (SAC 9987 - EV charging services)

  constructor(
    @InjectRepository(ChargingStation)
    private readonly stationRepo: Repository<ChargingStation>,
    @InjectRepository(BatteryTelemetryLog)
    private readonly telemetryRepo: Repository<BatteryTelemetryLog>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * EV-121: Seed AP Capital Corridor charging hubs if repository is empty.
   */
  async ensureSeedStations(): Promise<void> {
    const count = await this.stationRepo.count();
    if (count === 0) {
      for (const s of AP_CAPITAL_CORRIDOR_CHARGERS) {
        const station = this.stationRepo.create({
          id: s.id,
          name: s.name,
          code: s.code,
          city: s.city,
          address: s.address,
          latitude: s.latitude,
          longitude: s.longitude,
          operator: s.operator,
          totalGuns: s.totalGuns,
          availableGuns: s.availableGuns,
          supportedConnectors: s.supportedConnectors,
          maxPowerKw: s.maxPowerKw,
          tariffPerKwhPaise: s.tariffPerKwhPaise,
          status: s.status,
          amenities: s.amenities,
          isActive: s.isActive,
        });
        await this.stationRepo.save(station);
      }
      this.logger.log(`[ChargingService] Seeded ${AP_CAPITAL_CORRIDOR_CHARGERS.length} AP Capital Corridor EV charging stations.`);
    }
  }

  /**
   * EV-121: Find nearby operational charging stations with distance calculation.
   */
  async findNearbyStations(query: NearbyChargerQueryDto): Promise<ChargingStationDto[]> {
    await this.ensureSeedStations();
    const stations = await this.stationRepo.find({ where: { isActive: true } });

    let results = stations.map((s) => {
      let distanceKm: number | undefined;
      if (query.latitude !== undefined && query.longitude !== undefined) {
        distanceKm =
          Math.round(
            this.haversineDistanceKm(query.latitude, query.longitude, s.latitude, s.longitude) * 10,
          ) / 10;
      }
      return this.toStationDto(s, distanceKm);
    });

    if (query.radiusKm !== undefined && query.latitude !== undefined) {
      results = results.filter((s) => s.distanceKm !== undefined && s.distanceKm <= query.radiusKm!);
    }

    if (query.connectorType) {
      results = results.filter((s) => s.supportedConnectors.includes(query.connectorType!));
    }

    if (query.minPowerKw) {
      results = results.filter((s) => s.maxPowerKw >= query.minPowerKw!);
    }

    if (query.latitude !== undefined) {
      results.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return results;
  }

  /**
   * Retrieve station by ID.
   */
  async getStation(stationId: string): Promise<ChargingStationDto> {
    await this.ensureSeedStations();
    const station = await this.stationRepo.findOne({ where: { id: stationId } });
    if (!station) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Charging station '${stationId}' not found.`,
      });
    }
    return this.toStationDto(station);
  }

  /**
   * EV-122: Reserve en-route charging slot with 15-minute expiration hold.
   */
  async reserveSlot(
    captainId: string,
    dto: CreateChargingReservationDto,
  ): Promise<ChargingReservationDto> {
    await this.ensureSeedStations();

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const station = await manager.findOne(ChargingStation, {
        where: { id: dto.stationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!station) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Charging station '${dto.stationId}' not found.`,
        });
      }

      if (station.status !== ChargingStationStatus.OPERATIONAL) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Station is currently in ${station.status} status and cannot accept reservations.`,
        });
      }

      if (station.availableGuns <= 0) {
        throw new ConflictException({
          code: ApiErrorCode.CONFLICT,
          message: 'No charging guns currently available at this station.',
        });
      }

      if (!station.supportedConnectors.includes(dto.connectorType)) {
        throw new BadRequestException({
          code: ApiErrorCode.BAD_REQUEST,
          message: `Connector '${dto.connectorType}' is not supported at this station.`,
        });
      }

      station.availableGuns -= 1;
      await manager.save(station);

      const reservedUntil = new Date(Date.now() + this.RESERVATION_HOLD_MINUTES * 60 * 1000);
      const reservation = manager.create(ChargingReservation, {
        stationId: station.id,
        captainId,
        vehicleId: dto.vehicleId,
        connectorType: dto.connectorType,
        status: ChargingReservationStatus.RESERVED,
        reservedUntil,
        kwhConsumed: 0.0,
        energyFarePaise: 0,
        gstPaise: 0,
        totalFarePaise: 0,
      });

      const savedReservation = await manager.save(reservation);
      this.logger.log(
        `[ChargingService] Reserved slot ${savedReservation.id} at ${station.name} for captain ${captainId} (held until ${reservedUntil.toISOString()})`,
      );

      return this.toReservationDto(savedReservation, station.name, Number(station.tariffPerKwhPaise));
    });
  }

  /**
   * EV-123 & EV-124: Ingest real-time battery State-of-Charge (SoC),
   * trigger automated dispatch lockout if SoC < 18%, and recommend nearest charger.
   */
  async reportBatteryTelemetry(
    captainId: string,
    dto: BatteryTelemetryReportDto,
  ): Promise<BatteryTelemetryResponseDto> {
    await this.ensureSeedStations();

    const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
    if (vehicle && vehicle.propulsionType !== PropulsionType.BATTERY_ELECTRIC) {
      throw new BadRequestException({
        code: ApiErrorCode.PROPULSION_NON_ELECTRIC,
        message: 'Only 100% battery-electric vehicles are permitted on EcoRide.',
      });
    }

    const ratedRange = vehicle ? Number(vehicle.ratedRangeKm) || 120 : 120;
    const socPercent = Math.max(0, Math.min(100, dto.socPercent));
    const estimatedRangeKm =
      dto.estimatedRangeKm !== undefined
        ? dto.estimatedRangeKm
        : Math.round(((ratedRange * socPercent) / 100) * 10) / 10;

    const isCriticalLow =
      socPercent < this.HARD_LOCKOUT_SOC_PERCENT || estimatedRangeKm < this.MIN_SAFE_RANGE_KM;
    const isWarningLow = socPercent < this.LOW_BATTERY_WARNING_SOC_PERCENT;

    let nearestCharger: ChargingStationDto | undefined;
    if (isCriticalLow || isWarningLow) {
      const lat = dto.currentLatitude ?? 16.5062;
      const lon = dto.currentLongitude ?? 80.648;
      const nearby = await this.findNearbyStations({
        latitude: lat,
        longitude: lon,
        radiusKm: 50,
      });
      nearestCharger = nearby[0];
    }

    let recommendedAction = 'DISPATCH_READY';
    let lockoutReason: string | undefined;

    if (isCriticalLow) {
      recommendedAction = 'DISPATCH_LOCKED_OUT_NAVIGATE_TO_CHARGER';
      lockoutReason = `Battery SoC (${socPercent}%) is below minimum threshold (${this.HARD_LOCKOUT_SOC_PERCENT}%). Dispatch offers blocked.`;
    } else if (isWarningLow) {
      recommendedAction = 'LOW_BATTERY_WARNING_PLAN_CHARGING';
    }

    // Save telemetry log
    const log = this.telemetryRepo.create({
      vehicleId: dto.vehicleId,
      captainId,
      socPercent,
      estimatedRangeKm,
      source: dto.source || 'MANUAL_TELEMETRY',
      confidenceScore: 0.95,
      batteryTemperatureC: dto.batteryTemperatureC || 32.0,
      isLockoutTriggered: isCriticalLow,
    });
    await this.telemetryRepo.save(log);

    // Update vehicle's live SoC
    if (vehicle) {
      vehicle.currentSocPercent = socPercent;
      await this.vehicleRepo.save(vehicle);
    }

    return {
      vehicleId: dto.vehicleId,
      socPercent,
      estimatedRangeKm,
      isDispatchEligible: !isCriticalLow,
      isLockoutActive: isCriticalLow,
      lockoutReason,
      nearestCharger,
      recommendedAction,
    };
  }

  /**
   * EV-125: Complete charging session, compute kWh energy tariff with 18% AP GST,
   * post balanced double-entry ledger entries, and restore station gun availability.
   */
  async completeChargingSession(
    _captainId: string,
    dto: CompleteChargingSessionDto,
  ): Promise<ChargingReservationDto> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const reservation = await manager.findOne(ChargingReservation, {
        where: { id: dto.reservationId },
        relations: ['station'],
      });

      if (!reservation) {
        throw new NotFoundException({
          code: ApiErrorCode.NOT_FOUND,
          message: `Charging reservation '${dto.reservationId}' not found.`,
        });
      }

      if (
        reservation.status !== ChargingReservationStatus.RESERVED &&
        reservation.status !== ChargingReservationStatus.CHARGING
      ) {
        throw new BadRequestException({
          code: ApiErrorCode.CONFLICT,
          message: `Charging session cannot be completed in status '${reservation.status}'.`,
        });
      }

      const station = reservation.station;
      const tariffPerKwh = Number(station.tariffPerKwhPaise);
      const energyFarePaise = Math.round(dto.kwhConsumed * tariffPerKwh);
      const gstPaise = Math.round(energyFarePaise * this.CHARGING_GST_RATE);
      const totalFarePaise = energyFarePaise + gstPaise;

      reservation.status = ChargingReservationStatus.COMPLETED;
      reservation.kwhConsumed = dto.kwhConsumed;
      reservation.energyFarePaise = energyFarePaise;
      reservation.gstPaise = gstPaise;
      reservation.totalFarePaise = totalFarePaise;
      const savedReservation = await manager.save(reservation);

      // Restore station available gun count
      station.availableGuns = Math.min(station.totalGuns, station.availableGuns + 1);
      await manager.save(station);

      // Post double-entry ledger entries for charging session settlement
      const entryDebit = manager.create(LedgerEntry, {
        idempotencyKey: `CHARGING_SESSION_${reservation.id}_DEBIT`,
        bookingId: reservation.id,
        accountId: 'CAPTAIN_WALLET',
        entryType: 'DEBIT',
        amountPaise: totalFarePaise,
        currency: 'INR',
        description: `EV fast charge at ${station.name}: ${dto.kwhConsumed} kWh`,
      });
      const entryCredit = manager.create(LedgerEntry, {
        idempotencyKey: `CHARGING_SESSION_${reservation.id}_CREDIT`,
        bookingId: reservation.id,
        accountId: 'CHARGING_OPERATOR_PAYABLE',
        entryType: 'CREDIT',
        amountPaise: totalFarePaise,
        currency: 'INR',
        description: `Settlement payable to operator ${station.operator} for ${dto.kwhConsumed} kWh`,
      });
      await manager.save([entryDebit, entryCredit]);

      // Update vehicle SoC to post-charge level
      const vehicle = await manager.findOne(Vehicle, { where: { id: reservation.vehicleId } });
      if (vehicle) {
        vehicle.currentSocPercent = dto.endSocPercent;
        await manager.save(vehicle);
      }

      this.logger.log(
        `[ChargingService] Completed charging session ${reservation.id} at ${station.name}: ${dto.kwhConsumed} kWh (₹${(totalFarePaise / 100).toFixed(2)})`,
      );

      return this.toReservationDto(savedReservation, station.name, tariffPerKwh);
    });
  }

  // --- Helper Methods ---

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private toStationDto(s: ChargingStation, distanceKm?: number): ChargingStationDto {
    const tariffPerKwhPaise = Number(s.tariffPerKwhPaise);
    return {
      id: s.id,
      name: s.name,
      code: s.code,
      city: s.city,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      distanceKm,
      operator: s.operator,
      totalGuns: s.totalGuns,
      availableGuns: s.availableGuns,
      supportedConnectors: s.supportedConnectors,
      maxPowerKw: s.maxPowerKw,
      tariffPerKwhPaise,
      formattedTariff: `₹${(tariffPerKwhPaise / 100).toFixed(2)}/kWh`,
      status: s.status,
      amenities: s.amenities || [],
      isActive: s.isActive,
    };
  }

  private toReservationDto(
    r: ChargingReservation,
    stationName: string,
    tariffPerKwhPaise: number,
  ): ChargingReservationDto {
    const totalFarePaise = Number(r.totalFarePaise);
    return {
      id: r.id,
      stationId: r.stationId,
      stationName,
      captainId: r.captainId,
      vehicleId: r.vehicleId,
      connectorType: r.connectorType,
      status: r.status,
      reservedUntil: r.reservedUntil.toISOString(),
      kwhConsumed: r.kwhConsumed ? Number(r.kwhConsumed) : undefined,
      tariffPerKwhPaise,
      energyFarePaise: Number(r.energyFarePaise),
      gstPaise: Number(r.gstPaise),
      totalFarePaise,
      formattedTotalFare: `₹${(totalFarePaise / 100).toFixed(2)}`,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    };
  }
}
