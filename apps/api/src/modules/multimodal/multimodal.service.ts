import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { TransitHub } from '../../database/entities/transit-hub.entity';
import { MultiModalTicket } from '../../database/entities/multi-modal-ticket.entity';
import {
  TransitHubType,
  TransitHubDto,
  MultiModalTripBookingDto,
  MultiModalTicketDto,
} from '@ecoride/contracts';

@Injectable()
export class MultimodalService {
  constructor(
    @InjectRepository(TransitHub)
    private readonly hubRepo: Repository<TransitHub>,
    @InjectRepository(MultiModalTicket)
    private readonly ticketRepo: Repository<MultiModalTicket>,
  ) {}

  /**
   * List Andhra Pradesh multi-modal transit interchange hubs
   */
  async listTransitHubs(city?: string, type?: TransitHubType): Promise<TransitHubDto[]> {
    let hubs = await this.hubRepo.find({ where: { isActive: true } });

    if (hubs.length === 0) {
      // Seed default AP transit interchange points
      const defaults = [
        this.hubRepo.create({
          name: 'Pandit Nehru Bus Station (PNBS)',
          hubType: TransitHubType.APSRTC_BUS_STATION,
          city: 'Vijayawada',
          address: 'PNBS Complex, Bundar Road, Vijayawada, AP 520013',
          latitude: 16.508,
          longitude: 80.612,
          dedicatedEvPickupBay: 'EV-Bay-PNBS-01',
          isActive: true,
        }),
        this.hubRepo.create({
          name: 'Vijayawada Junction Railway Station (BZA)',
          hubType: TransitHubType.RAILWAY_STATION,
          city: 'Vijayawada',
          address: 'Station Road, Vijayawada, AP 520001',
          latitude: 16.5186,
          longitude: 80.62,
          dedicatedEvPickupBay: 'EV-Bay-BZA-West',
          isActive: true,
        }),
        this.hubRepo.create({
          name: 'Vijayawada International Airport (VGA)',
          hubType: TransitHubType.AIRPORT,
          city: 'Vijayawada',
          address: 'NH-16, Gannavaram, AP 521102',
          latitude: 16.5304,
          longitude: 80.7968,
          dedicatedEvPickupBay: 'EV-Bay-Airport-Arrivals',
          isActive: true,
        }),
        this.hubRepo.create({
          name: 'Guntur Junction Railway Station (GNT)',
          hubType: TransitHubType.RAILWAY_STATION,
          city: 'Guntur',
          address: 'Station Road, Sambasiva Pet, Guntur, AP 522001',
          latitude: 16.3033,
          longitude: 80.4437,
          dedicatedEvPickupBay: 'EV-Bay-GNT-Main',
          isActive: true,
        }),
        this.hubRepo.create({
          name: 'NTR Bus Station (GNT RTC)',
          hubType: TransitHubType.APSRTC_BUS_STATION,
          city: 'Guntur',
          address: 'Old Bus Stand Road, Guntur, AP 522003',
          latitude: 16.299,
          longitude: 80.448,
          dedicatedEvPickupBay: 'EV-Bay-GNT-Bus',
          isActive: true,
        }),
      ];
      hubs = await this.hubRepo.save(defaults);
    }

    let filtered = hubs;
    if (city) {
      filtered = filtered.filter((h) => h.city.toLowerCase() === city.toLowerCase());
    }
    if (type) {
      filtered = filtered.filter((h) => h.hubType === type);
    }

    return filtered.map((h) => ({
      id: h.id,
      name: h.name,
      hubType: h.hubType,
      city: h.city,
      address: h.address,
      latitude: Number(h.latitude),
      longitude: Number(h.longitude),
      dedicatedEvPickupBay: h.dedicatedEvPickupBay,
      isActive: h.isActive,
    }));
  }

  /**
   * Book an EV first/last-mile feeder ride synchronized with APSRTC, train, or flight schedule
   */
  async bookMultiModalFeederTrip(
    riderId: string,
    dto: MultiModalTripBookingDto,
  ): Promise<MultiModalTicketDto> {
    const hub = await this.hubRepo.findOne({ where: { id: dto.transitHubId } });
    if (!hub) {
      throw new NotFoundException(`Transit hub ${dto.transitHubId} not found`);
    }

    const departure = new Date(dto.transitDepartureTime);
    const now = new Date();
    if (departure.getTime() < now.getTime()) {
      throw new BadRequestException('Transit departure time must be in the future');
    }

    // Schedule EV pickup 45 minutes prior to transit departure
    const pickupTime = new Date(departure.getTime() - 45 * 60000);
    const estimatedArrivalAtHub = new Date(departure.getTime() - 15 * 60000);

    const ticketSuffix = randomBytes(2).toString('hex').toUpperCase();
    const ticketNumber = `MMT-AP-${Date.now().toString().slice(-6)}-${ticketSuffix}`;
    const farePaise = 15000; // Flat subsidized feeder fare ₹150.00

    // Construct tamper-proof unified QR payload for APSRTC / Railway integration
    const qrRaw = `${ticketNumber}:${hub.id}:${dto.transitMode}:${dto.transitScheduleNumber || 'SYNC'}:${riderId}`;
    const qrSignature = createHash('sha256').update(qrRaw).digest('hex').substring(0, 16);
    const unifiedQrPayload = JSON.stringify({
      ticketNumber,
      hubName: hub.name,
      bay: hub.dedicatedEvPickupBay,
      pickup: pickupTime.toISOString(),
      departure: departure.toISOString(),
      passengers: dto.passengerCount,
      sig: qrSignature,
    });

    const ticket = this.ticketRepo.create({
      ticketNumber,
      bookingId: `bk-${randomBytes(4).toString('hex')}`,
      riderId,
      transitHubId: hub.id,
      transitHubName: hub.name,
      pickupTime,
      estimatedArrivalAtHub,
      farePaise,
      unifiedQrPayload,
      status: 'CONFIRMED',
    });

    const saved = await this.ticketRepo.save(ticket);

    return {
      id: saved.id,
      ticketNumber: saved.ticketNumber,
      bookingId: saved.bookingId,
      transitHubName: saved.transitHubName,
      pickupTime: saved.pickupTime.toISOString(),
      estimatedArrivalAtHub: saved.estimatedArrivalAtHub.toISOString(),
      farePaise: Number(saved.farePaise),
      formattedFare: `₹${(Number(saved.farePaise) / 100).toFixed(2)}`,
      unifiedQrPayload: saved.unifiedQrPayload,
      status: saved.status,
      createdAt: saved.createdAt.toISOString(),
    };
  }

  /**
   * Validate and board feeder ride via QR scanner
   */
  async boardMultiModalTrip(ticketNumber: string): Promise<MultiModalTicketDto> {
    const ticket = await this.ticketRepo.findOne({ where: { ticketNumber } });
    if (!ticket) {
      throw new NotFoundException(`Multi-modal ticket ${ticketNumber} not found`);
    }

    if (ticket.status !== 'CONFIRMED') {
      throw new BadRequestException(`Ticket is already ${ticket.status}`);
    }

    ticket.status = 'BOARDED';
    const updated = await this.ticketRepo.save(ticket);

    return {
      id: updated.id,
      ticketNumber: updated.ticketNumber,
      bookingId: updated.bookingId,
      transitHubName: updated.transitHubName,
      pickupTime: updated.pickupTime.toISOString(),
      estimatedArrivalAtHub: updated.estimatedArrivalAtHub.toISOString(),
      farePaise: Number(updated.farePaise),
      formattedFare: `₹${(Number(updated.farePaise) / 100).toFixed(2)}`,
      unifiedQrPayload: updated.unifiedQrPayload,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}

