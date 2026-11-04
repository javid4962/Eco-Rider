import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { randomBytes } from 'crypto';
import { CargoShipment } from '../../database/entities/cargo-shipment.entity';
import { CargoStop } from '../../database/entities/cargo-stop.entity';
import { CargoCodSettlement } from '../../database/entities/cargo-cod-settlement.entity';
import { Vehicle } from '../../database/entities/vehicle.entity';
import { LedgerEntry } from '../../database/entities/ledger-entry.entity';
import { CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CargoVehicleTier,
  CargoStopType,
  CargoShipmentStatus,
  CodSettlementStatus,
  CargoShipmentDto,
  CargoStopDto,
  CreateCargoShipmentDto,
  DeliverCargoStopDto,
  SettleCodDto,
  CargoPricingCalculation,
  PropulsionType,
  ApiErrorCode,
} from '@ecoride/contracts';

@Injectable()
export class CargoService {
  private readonly logger = new Logger(CargoService.name);

  // Maximum weight limits per BEV cargo tier in kilograms
  private readonly TIER_WEIGHT_LIMITS_KG: Record<CargoVehicleTier, number> = {
    [CargoVehicleTier.E_CARGO_2W]: 20,
    [CargoVehicleTier.E_CARGO_3W]: 500,
    [CargoVehicleTier.E_CARGO_4W_VAN]: 1500,
  };

  // Base pricing configurations (in integer paise)
  private readonly TIER_BASE_RATES: Record<
    CargoVehicleTier,
    { basePaise: number; perKmPaise: number; perKgPaise: number }
  > = {
    [CargoVehicleTier.E_CARGO_2W]: { basePaise: 4000, perKmPaise: 1200, perKgPaise: 200 },
    [CargoVehicleTier.E_CARGO_3W]: { basePaise: 12000, perKmPaise: 2000, perKgPaise: 50 },
    [CargoVehicleTier.E_CARGO_4W_VAN]: { basePaise: 35000, perKmPaise: 3500, perKgPaise: 30 },
  };

  private readonly EXTRA_STOP_FEE_PAISE = 2500; // ₹25 per additional stop
  private readonly HELPER_FEE_PAISE = 15000;     // ₹150 for loading helper assistance
  private readonly GST_RATE = 0.18;             // 18% GST (9% CGST + 9% SGST) for goods transport (SAC 9965)

  constructor(
    @InjectRepository(CargoShipment)
    private readonly shipmentRepo: Repository<CargoShipment>,
    @InjectRepository(CargoStop)
    private readonly stopRepo: Repository<CargoStop>,
    @InjectRepository(CargoCodSettlement)
    private readonly codSettlementRepo: Repository<CargoCodSettlement>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * EV-113: Authoritative pricing calculation with BEV cargo weight tiers,
   * multi-stop distance, helper fee, and 18% AP GST in integer paise.
   */
  calculateCargoFare(
    tier: CargoVehicleTier,
    packageWeightKg: number,
    stops: { latitude: number; longitude: number }[],
    requiresHelper = false,
  ): CargoPricingCalculation {
    const maxWeight = this.TIER_WEIGHT_LIMITS_KG[tier];
    if (packageWeightKg > maxWeight) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Package weight ${packageWeightKg}kg exceeds maximum allowable weight ${maxWeight}kg for ${tier}.`,
      });
    }

    if (!stops || stops.length < 2) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'A cargo shipment must have at least 1 pickup and 1 drop stop.',
      });
    }

    // Calculate total route distance across sequential stops
    let totalDistanceKm = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      totalDistanceKm += this.haversineDistanceKm(
        stops[i].latitude,
        stops[i].longitude,
        stops[i + 1].latitude,
        stops[i + 1].longitude,
      );
    }
    const estimatedDistanceKm = Math.max(1.0, Math.round(totalDistanceKm * 10) / 10);

    const rates = this.TIER_BASE_RATES[tier];
    const baseFarePaise = rates.basePaise;
    const distanceFarePaise = Math.round(estimatedDistanceKm * rates.perKmPaise);
    const weightFarePaise = Math.round(packageWeightKg * rates.perKgPaise);

    // Multi-stop fee applies for stops beyond the initial pickup and drop (i.e. stops > 2)
    const extraStopsCount = Math.max(0, stops.length - 2);
    const stopsFarePaise = extraStopsCount * this.EXTRA_STOP_FEE_PAISE;

    const helperFarePaise = requiresHelper ? this.HELPER_FEE_PAISE : 0;

    const subtotalFarePaise =
      baseFarePaise + distanceFarePaise + weightFarePaise + stopsFarePaise + helperFarePaise;
    const gstPaise = Math.round(subtotalFarePaise * this.GST_RATE);
    const totalFarePaise = subtotalFarePaise + gstPaise;

    return {
      tier,
      packageWeightKg,
      estimatedDistanceKm,
      stopsCount: stops.length,
      requiresHelper,
      baseFarePaise,
      weightFarePaise,
      distanceFarePaise,
      stopsFarePaise,
      helperFarePaise,
      subtotalFarePaise,
      gstPaise,
      totalFarePaise,
    };
  }

  /**
   * EV-114 & EV-115: Create cargo shipment with multi-stop routing and 4-digit POD OTPs.
   */
  async createShipment(
    actor: CurrentActorPayload | undefined,
    dto: CreateCargoShipmentDto,
  ): Promise<CargoShipmentDto> {
    const senderId = dto.senderId || actor?.id;
    if (!senderId) {
      throw new BadRequestException({
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Sender identity is required.',
      });
    }

    if (!dto.stops || dto.stops.length < 2) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'A cargo shipment must have at least 1 pickup and 1 drop stop.',
      });
    }

    const hasPickup = dto.stops.some((s) => s.stopType === CargoStopType.PICKUP);
    const hasDrop = dto.stops.some((s) => s.stopType === CargoStopType.DROP);
    if (!hasPickup || !hasDrop) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Cargo shipment requires at least one PICKUP stop and one DROP stop.',
      });
    }

    const pricing = this.calculateCargoFare(
      dto.tier,
      dto.packageWeightKg,
      dto.stops,
      dto.requiresHelper,
    );

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = randomBytes(2).toString('hex').toUpperCase();
    const trackingNumber = `ECO-CRG-${dateStr}-${randomHex}`;

    let totalCodPaise = 0;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const shipment = manager.create(CargoShipment, {
        trackingNumber,
        senderId,
        tier: dto.tier,
        status: CargoShipmentStatus.REQUESTED,
        packageWeightKg: dto.packageWeightKg,
        packageDescription: dto.packageDescription,
        requiresHelper: !!dto.requiresHelper,
        baseFarePaise: pricing.baseFarePaise,
        weightFarePaise: pricing.weightFarePaise,
        distanceFarePaise: pricing.distanceFarePaise,
        stopsFarePaise: pricing.stopsFarePaise,
        helperFarePaise: pricing.helperFarePaise,
        gstPaise: pricing.gstPaise,
        totalFarePaise: pricing.totalFarePaise,
        totalCodPaise: 0,
      });

      const savedShipment = await manager.save(shipment);

      const savedStops: CargoStop[] = [];
      for (let i = 0; i < dto.stops.length; i++) {
        const stopDto = dto.stops[i];
        const codPaise = Math.max(0, Math.round(stopDto.codPaise || 0));
        totalCodPaise += codPaise;

        // Generate 4-digit POD OTP for DROP stops
        const podOtp =
          stopDto.stopType === CargoStopType.DROP
            ? Math.floor(1000 + Math.random() * 9000).toString()
            : null;

        const stop = manager.create(CargoStop, {
          shipmentId: savedShipment.id,
          sequence: i + 1,
          stopType: stopDto.stopType,
          address: stopDto.address,
          latitude: stopDto.latitude,
          longitude: stopDto.longitude,
          contactName: stopDto.contactName,
          contactPhone: stopDto.contactPhone,
          instructions: stopDto.instructions || null,
          codPaise,
          podOtp,
          isCompleted: false,
        });

        const savedStop = await manager.save(stop);
        savedStops.push(savedStop);
      }

      savedShipment.totalCodPaise = totalCodPaise;
      savedShipment.stops = savedStops;
      await manager.save(savedShipment);

      this.logger.log(
        `[CargoService] Created shipment ${savedShipment.trackingNumber} (${savedShipment.tier}) for sender ${senderId}`,
      );

      return this.toShipmentDto(savedShipment, savedStops);
    });
  }

  /**
   * EV-116: Assign shipment to BEV captain and vehicle.
   * Strictly enforces 100% BEV propulsion (ICE/Hybrid rejected).
   */
  async assignShipment(
    shipmentId: string,
    captainId: string,
    vehicleId: string,
  ): Promise<CargoShipmentDto> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ['stops'],
    });

    if (!shipment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Cargo shipment '${shipmentId}' not found.`,
      });
    }

    if (
      shipment.status !== CargoShipmentStatus.REQUESTED &&
      shipment.status !== CargoShipmentStatus.DRAFT
    ) {
      throw new BadRequestException({
        code: ApiErrorCode.CONFLICT,
        message: `Shipment cannot be assigned in status ${shipment.status}.`,
      });
    }

    // Check vehicle propulsion is 100% BEV
    const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId } });
    if (vehicle && vehicle.propulsionType !== PropulsionType.BATTERY_ELECTRIC) {
      this.logger.warn(
        `[CargoService] SECURITY ALERT: Rejected non-EV vehicle ${vehicleId} with propulsion ${vehicle.propulsionType} for cargo dispatch.`,
      );
      throw new BadRequestException({
        code: ApiErrorCode.PROPULSION_NON_ELECTRIC,
        message: 'Only 100% battery-electric vehicles are permitted on EcoRide.',
      });
    }

    shipment.assignedCaptainId = captainId;
    shipment.assignedVehicleId = vehicleId;
    shipment.status = CargoShipmentStatus.ASSIGNED;

    const saved = await this.shipmentRepo.save(shipment);
    return this.toShipmentDto(saved, shipment.stops);
  }

  /**
   * EV-117: Complete pickup stop.
   */
  async completePickup(shipmentId: string, stopId: string, captainId: string): Promise<CargoShipmentDto> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ['stops'],
    });

    if (!shipment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Cargo shipment '${shipmentId}' not found.`,
      });
    }

    if (shipment.assignedCaptainId && shipment.assignedCaptainId !== captainId) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'You are not the assigned captain for this cargo shipment.',
      });
    }

    const stop = shipment.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Stop '${stopId}' not found in this shipment.`,
      });
    }

    if (stop.stopType !== CargoStopType.PICKUP) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Specified stop is not a PICKUP stop.',
      });
    }

    stop.isCompleted = true;
    stop.completedAt = new Date();
    await this.stopRepo.save(stop);

    shipment.status = CargoShipmentStatus.IN_TRANSIT;
    const saved = await this.shipmentRepo.save(shipment);

    return this.toShipmentDto(saved, shipment.stops);
  }

  /**
   * EV-118 & EV-119: Complete DROP stop with geofenced Proof of Delivery (POD) OTP verification
   * and Cash-on-Delivery (COD) ledger collection.
   */
  async deliverStop(
    shipmentId: string,
    stopId: string,
    captainId: string,
    dto: DeliverCargoStopDto,
  ): Promise<CargoShipmentDto> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ['stops'],
    });

    if (!shipment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Cargo shipment '${shipmentId}' not found.`,
      });
    }

    if (shipment.assignedCaptainId && shipment.assignedCaptainId !== captainId) {
      throw new ForbiddenException({
        code: ApiErrorCode.FORBIDDEN,
        message: 'You are not the assigned captain for this cargo shipment.',
      });
    }

    const stop = shipment.stops.find((s) => s.id === stopId);
    if (!stop) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Stop '${stopId}' not found in this shipment.`,
      });
    }

    if (stop.stopType !== CargoStopType.DROP) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'Specified stop is not a DROP stop.',
      });
    }

    if (stop.isCompleted) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: 'This stop has already been marked as completed.',
      });
    }

    // Verify 4-digit POD OTP
    if (!stop.podOtp || stop.podOtp !== dto.podOtp.trim()) {
      throw new BadRequestException({
        code: ApiErrorCode.INVALID_START_OTP,
        message: 'Invalid Proof-of-Delivery (POD) OTP.',
      });
    }

    // Verify captain is within 300 meters of the delivery drop location
    const distMeters =
      this.haversineDistanceKm(
        dto.captainLatitude,
        dto.captainLongitude,
        stop.latitude,
        stop.longitude,
      ) * 1000;

    if (distMeters > 300) {
      throw new BadRequestException({
        code: ApiErrorCode.BAD_REQUEST,
        message: `Captain location is ${Math.round(distMeters)}m from drop point (max allowed 300m).`,
      });
    }

    const stopCodPaise = Number(stop.codPaise);

    return this.dataSource.transaction(async (manager: EntityManager) => {
      // Reconcile COD collection if required at this stop
      if (stopCodPaise > 0) {
        if (!dto.cashCollectedPaise || dto.cashCollectedPaise !== stopCodPaise) {
          throw new BadRequestException({
            code: ApiErrorCode.BAD_REQUEST,
            message: `COD collection of ₹${(stopCodPaise / 100).toFixed(2)} required for this delivery stop.`,
          });
        }

        const codSettlement = manager.create(CargoCodSettlement, {
          shipmentId: shipment.id,
          stopId: stop.id,
          captainId,
          merchantAccountId: shipment.senderId,
          amountPaise: stopCodPaise,
          status: CodSettlementStatus.COLLECTED_BY_CAPTAIN,
          collectedAt: new Date(),
        });
        await manager.save(codSettlement);

        // Double-entry ledger for COD collection
        const entryDebit = manager.create(LedgerEntry, {
          idempotencyKey: `CARGO_COD_COLLECT_${shipment.id}_${stop.id}_DEBIT`,
          bookingId: shipment.id,
          accountId: 'CAPTAIN_COD_IN_HAND',
          entryType: 'DEBIT',
          amountPaise: stopCodPaise,
          currency: 'INR',
          description: `Captain COD collection for shipment ${shipment.trackingNumber} stop ${stop.sequence}`,
        });
        const entryCredit = manager.create(LedgerEntry, {
          idempotencyKey: `CARGO_COD_COLLECT_${shipment.id}_${stop.id}_CREDIT`,
          bookingId: shipment.id,
          accountId: 'MERCHANT_COD_PAYABLE',
          entryType: 'CREDIT',
          amountPaise: stopCodPaise,
          currency: 'INR',
          description: `Merchant payable for shipment ${shipment.trackingNumber} stop ${stop.sequence}`,
        });
        await manager.save([entryDebit, entryCredit]);
      }

      stop.isCompleted = true;
      stop.recipientName = dto.recipientName;
      stop.signatureHash = dto.signatureHash || null;
      stop.completedAt = new Date();
      await manager.save(stop);

      // Check if all drops are completed
      const allStops = await manager.find(CargoStop, { where: { shipmentId: shipment.id } });
      const allCompleted = allStops.every((s) => s.id === stop.id || s.isCompleted);

      if (allCompleted) {
        shipment.status = CargoShipmentStatus.DELIVERED;
        await manager.save(shipment);
      }

      this.logger.log(
        `[CargoService] Delivered stop ${stop.sequence} for shipment ${shipment.trackingNumber} (OTP Verified)`,
      );

      return this.toShipmentDto(shipment, allStops);
    });
  }

  /**
   * EV-120: Settle collected COD back to merchant via double-entry bank transfer.
   */
  async settleCodToMerchant(dto: SettleCodDto): Promise<CargoCodSettlement> {
    const settlement = await this.codSettlementRepo.findOne({
      where: { shipmentId: dto.shipmentId, stopId: dto.stopId },
    });

    if (!settlement) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: 'COD settlement record not found.',
      });
    }

    if (settlement.status !== CodSettlementStatus.COLLECTED_BY_CAPTAIN) {
      throw new BadRequestException({
        code: ApiErrorCode.CONFLICT,
        message: `COD settlement cannot be processed in status ${settlement.status}.`,
      });
    }

    const amountPaise = Number(settlement.amountPaise);

    return this.dataSource.transaction(async (manager: EntityManager) => {
      settlement.status = CodSettlementStatus.SETTLED_TO_MERCHANT;
      settlement.settledAt = new Date();
      settlement.referenceId = dto.referenceId;
      const saved = await manager.save(settlement);

      // Balanced ledger entries for merchant remittance
      const entryDebit = manager.create(LedgerEntry, {
        idempotencyKey: `CARGO_COD_REMIT_${dto.referenceId}_DEBIT`,
        accountId: 'MERCHANT_COD_PAYABLE',
        entryType: 'DEBIT',
        amountPaise,
        currency: 'INR',
        description: `Disbursed COD payable to merchant ${dto.merchantAccountId}`,
      });
      const entryCredit = manager.create(LedgerEntry, {
        idempotencyKey: `CARGO_COD_REMIT_${dto.referenceId}_CREDIT`,
        accountId: 'BANK_ESCROW_DISBURSAL',
        entryType: 'CREDIT',
        amountPaise,
        currency: 'INR',
        description: `Bank escrow transfer for COD remittance ${dto.referenceId}`,
      });
      await manager.save([entryDebit, entryCredit]);

      return saved;
    });
  }

  /**
   * Retrieve shipment details.
   */
  async getShipment(shipmentId: string): Promise<CargoShipmentDto> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id: shipmentId },
      relations: ['stops'],
    });

    if (!shipment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Cargo shipment '${shipmentId}' not found.`,
      });
    }

    return this.toShipmentDto(shipment, shipment.stops);
  }

  /**
   * Public tracking by trackingNumber.
   */
  async trackShipment(trackingNumber: string): Promise<CargoShipmentDto> {
    const shipment = await this.shipmentRepo.findOne({
      where: { trackingNumber },
      relations: ['stops'],
    });

    if (!shipment) {
      throw new NotFoundException({
        code: ApiErrorCode.NOT_FOUND,
        message: `Shipment with tracking number '${trackingNumber}' not found.`,
      });
    }

    return this.toShipmentDto(shipment, shipment.stops);
  }

  // --- Helper Methods ---

  private haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
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

  private toShipmentDto(shipment: CargoShipment, stops: CargoStop[]): CargoShipmentDto {
    const sortedStops = [...stops].sort((a, b) => a.sequence - b.sequence);
    const totalFarePaise = Number(shipment.totalFarePaise);

    return {
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      senderId: shipment.senderId,
      assignedCaptainId: shipment.assignedCaptainId || undefined,
      assignedVehicleId: shipment.assignedVehicleId || undefined,
      tier: shipment.tier,
      status: shipment.status,
      packageWeightKg: Number(shipment.packageWeightKg),
      packageDescription: shipment.packageDescription,
      requiresHelper: shipment.requiresHelper,
      baseFarePaise: Number(shipment.baseFarePaise),
      weightFarePaise: Number(shipment.weightFarePaise),
      distanceFarePaise: Number(shipment.distanceFarePaise),
      stopsFarePaise: Number(shipment.stopsFarePaise),
      helperFarePaise: Number(shipment.helperFarePaise),
      gstPaise: Number(shipment.gstPaise),
      totalFarePaise,
      formattedTotalFare: `₹${(totalFarePaise / 100).toFixed(2)}`,
      totalCodPaise: Number(shipment.totalCodPaise),
      stops: sortedStops.map((s) => this.toStopDto(s)),
      createdAt: shipment.createdAt ? shipment.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: shipment.updatedAt ? shipment.updatedAt.toISOString() : new Date().toISOString(),
    };
  }

  private toStopDto(stop: CargoStop): CargoStopDto {
    return {
      id: stop.id,
      sequence: stop.sequence,
      stopType: stop.stopType,
      address: stop.address,
      latitude: stop.latitude,
      longitude: stop.longitude,
      contactName: stop.contactName,
      contactPhone: stop.contactPhone,
      instructions: stop.instructions || undefined,
      codPaise: Number(stop.codPaise),
      podOtp: stop.podOtp || undefined,
      isCompleted: stop.isCompleted,
      completedAt: stop.completedAt ? stop.completedAt.toISOString() : undefined,
    };
  }
}
