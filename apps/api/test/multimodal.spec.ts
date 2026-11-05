import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { MultimodalService } from '../src/modules/multimodal/multimodal.service';
import { MultimodalController } from '../src/modules/multimodal/multimodal.controller';
import { TransitHub } from '../src/database/entities/transit-hub.entity';
import { MultiModalTicket } from '../src/database/entities/multi-modal-ticket.entity';
import { TransitHubType } from '@ecoride/contracts';

describe('Multi-Modal Feeder & Unified AP Transit (M30)', () => {
  let service: MultimodalService;

  const mockHubs: TransitHub[] = [
    {
      id: 'hub-pnbs',
      name: 'Pandit Nehru Bus Station (PNBS)',
      hubType: TransitHubType.APSRTC_BUS_STATION,
      city: 'Vijayawada',
      address: 'PNBS Complex, Vijayawada',
      latitude: 16.508,
      longitude: 80.612,
      dedicatedEvPickupBay: 'EV-Bay-PNBS-01',
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'hub-bza',
      name: 'Vijayawada Junction Railway Station (BZA)',
      hubType: TransitHubType.RAILWAY_STATION,
      city: 'Vijayawada',
      address: 'Station Road, Vijayawada',
      latitude: 16.5186,
      longitude: 80.62,
      dedicatedEvPickupBay: 'EV-Bay-BZA-West',
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'hub-gnt',
      name: 'Guntur Junction Railway Station (GNT)',
      hubType: TransitHubType.RAILWAY_STATION,
      city: 'Guntur',
      address: 'Station Road, Guntur',
      latitude: 16.3033,
      longitude: 80.4437,
      dedicatedEvPickupBay: 'EV-Bay-GNT-Main',
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const mockTickets: MultiModalTicket[] = [];

  const mockHubRepo = {
    find: jest.fn().mockResolvedValue(mockHubs),
    findOne: jest.fn(({ where }) => {
      const match = mockHubs.find((h) => h.id === where.id);
      return Promise.resolve(match || null);
    }),
    create: jest.fn((dto) => ({ id: `hub-${Math.random()}`, ...dto })),
    save: jest.fn((entityOrEntities) => Promise.resolve(entityOrEntities)),
  };

  const mockTicketRepo = {
    create: jest.fn((dto) => ({
      id: `ticket-uuid-${Math.random()}`,
      createdAt: new Date(),
      ...dto,
    })),
    save: jest.fn((entity) => {
      const idx = mockTickets.findIndex((t) => t.id === entity.id);
      if (idx >= 0) {
        mockTickets[idx] = entity;
      } else {
        mockTickets.push(entity);
      }
      return Promise.resolve(entity);
    }),
    findOne: jest.fn(({ where }) => {
      if (where.ticketNumber) {
        return Promise.resolve(
          mockTickets.find((t) => t.ticketNumber === where.ticketNumber) || null,
        );
      }
      return Promise.resolve(null);
    }),
  };

  beforeEach(async () => {
    mockTickets.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MultimodalController],
      providers: [
        MultimodalService,
        { provide: getRepositoryToken(TransitHub), useValue: mockHubRepo },
        { provide: getRepositoryToken(MultiModalTicket), useValue: mockTicketRepo },
      ],
    }).compile();

    service = module.get<MultimodalService>(MultimodalService);
  });

  describe('Transit Interchange Hubs', () => {
    it('should list all Andhra Pradesh transit hubs', async () => {
      const hubs = await service.listTransitHubs();
      expect(hubs.length).toBe(3);
      expect(hubs[0].dedicatedEvPickupBay).toBe('EV-Bay-PNBS-01');
    });

    it('should filter hubs by city and transit type', async () => {
      const gntHubs = await service.listTransitHubs('Guntur');
      expect(gntHubs.length).toBe(1);
      expect(gntHubs[0].city).toBe('Guntur');

      const rtcHubs = await service.listTransitHubs(undefined, TransitHubType.APSRTC_BUS_STATION);
      expect(rtcHubs.length).toBe(1);
      expect(rtcHubs[0].hubType).toBe(TransitHubType.APSRTC_BUS_STATION);
    });
  });

  describe('Multi-Modal Feeder Booking & QR Ticketing', () => {
    it('should book feeder ride with synchronized pickup time and QR payload', async () => {
      const departureTime = new Date(Date.now() + 3 * 3600000).toISOString(); // 3 hours from now

      const ticket = await service.bookMultiModalFeederTrip('rider-uuid-1', {
        originAddress: 'Benz Circle, Vijayawada',
        originLatitude: 16.502,
        originLongitude: 80.648,
        transitHubId: 'hub-bza',
        transitMode: 'INDIAN_RAILWAYS',
        transitScheduleNumber: 'Train #12727 Godavari Express',
        transitDepartureTime: departureTime,
        passengerCount: 1,
      });

      expect(ticket.ticketNumber).toContain('MMT-AP-');
      expect(ticket.transitHubName).toBe('Vijayawada Junction Railway Station (BZA)');
      expect(ticket.status).toBe('CONFIRMED');
      expect(ticket.farePaise).toBe(15000); // ₹150.00
      expect(ticket.formattedFare).toBe('₹150.00');

      // Verify QR payload
      const qrData = JSON.parse(ticket.unifiedQrPayload);
      expect(qrData.ticketNumber).toBe(ticket.ticketNumber);
      expect(qrData.bay).toBe('EV-Bay-BZA-West');
      expect(qrData.sig).toBeDefined();

      // Pickup time should be 45 minutes before departure
      const depDate = new Date(departureTime).getTime();
      const pickDate = new Date(ticket.pickupTime).getTime();
      expect(depDate - pickDate).toBe(45 * 60000);
    });

    it('should reject booking if transit departure time is in the past', async () => {
      const pastDeparture = new Date(Date.now() - 3600000).toISOString();

      await expect(
        service.bookMultiModalFeederTrip('rider-uuid-1', {
          originAddress: 'Benz Circle',
          originLatitude: 16.502,
          originLongitude: 80.648,
          transitHubId: 'hub-bza',
          transitMode: 'INDIAN_RAILWAYS',
          transitDepartureTime: pastDeparture,
          passengerCount: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should board feeder trip successfully via ticket validation', async () => {
      const departureTime = new Date(Date.now() + 2 * 3600000).toISOString();
      const ticket = await service.bookMultiModalFeederTrip('rider-uuid-1', {
        originAddress: 'Brodipet, Guntur',
        originLatitude: 16.312,
        originLongitude: 80.442,
        transitHubId: 'hub-gnt',
        transitMode: 'INDIAN_RAILWAYS',
        transitDepartureTime: departureTime,
        passengerCount: 2,
      });

      const boarded = await service.boardMultiModalTrip(ticket.ticketNumber);
      expect(boarded.status).toBe('BOARDED');
    });

    it('should reject boarding an already boarded trip', async () => {
      const departureTime = new Date(Date.now() + 2 * 3600000).toISOString();
      const ticket = await service.bookMultiModalFeederTrip('rider-uuid-1', {
        originAddress: 'PNBS',
        originLatitude: 16.508,
        originLongitude: 80.612,
        transitHubId: 'hub-pnbs',
        transitMode: 'APSRTC_EXPRESS',
        transitDepartureTime: departureTime,
        passengerCount: 1,
      });

      await service.boardMultiModalTrip(ticket.ticketNumber);

      await expect(
        service.boardMultiModalTrip(ticket.ticketNumber),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
