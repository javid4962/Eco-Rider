import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AirportFeederService } from '../src/modules/airport-feeder/airport-feeder.service';
import { AirportFeederBooking } from '../src/database/entities/airport-feeder-booking.entity';
import { FlightStatus } from '@ecoride/contracts';

describe('AirportFeederService (M74)', () => {
  let service: AirportFeederService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'ap-booking-1', ...dto })),
      save: jest.fn().mockImplementation(async (b) => ({ ...b })),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AirportFeederService,
        {
          provide: getRepositoryToken(AirportFeederBooking),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<AirportFeederService>(AirportFeederService);
  });

  it('should create an airport EV booking with assigned dedicated pickup bay', async () => {
    const booking = await service.createBooking({
      riderId: 'rider-exec-01',
      flightNumber: '6E-7128',
      scheduledArrival: '2026-11-05T14:30:00Z',
      destinationAddress: 'Benz Circle, Vijayawada',
      destinationLatitude: 16.497,
      destinationLongitude: 80.651,
      terminalGate: 'GATE_1',
      luggageCount: 2,
    });

    expect(booking.flightNumber).toBe('6E-7128');
    expect(booking.assignedPickupBay).toBe('EV_DEDICATED_BAY_01');
    expect(booking.farePaise).toBe(45000); // Base ₹450
  });

  it('should dynamically adjust pickup time when flight is delayed', async () => {
    const existing = {
      id: 'ap-booking-1',
      flightNumber: '6E-7128',
      scheduledArrivalTime: new Date('2026-11-05T14:30:00Z'),
      assignedPickupBay: 'EV_DEDICATED_BAY_01',
      farePaise: 45000,
    };
    mockRepo.find.mockResolvedValue([existing]);

    const updates = await service.syncFlightUpdate({
      flightNumber: '6E-7128',
      airline: 'IndiGo',
      originIata: 'DEL',
      destinationIata: 'VGA',
      scheduledArrivalTime: '2026-11-05T14:30:00Z',
      status: FlightStatus.DELAYED,
      delayMinutes: 35,
    });

    expect(updates.length).toBe(1);
    expect(updates[0].status).toBe('DELAY_ADJUSTED');
    expect(updates[0].delayAdjustedMinutes).toBe(35);
    // 14:30 + 35 min = 15:05:00
    expect(updates[0].adjustedPickupTime).toContain('15:05:00');
  });

  it('should refund booking when flight is cancelled', async () => {
    const existing = {
      id: 'ap-booking-1',
      flightNumber: 'AI-542',
      scheduledArrivalTime: new Date('2026-11-05T18:00:00Z'),
      assignedPickupBay: 'EV_DEDICATED_BAY_02',
      farePaise: 45000,
    };
    mockRepo.find.mockResolvedValue([existing]);

    const updates = await service.syncFlightUpdate({
      flightNumber: 'AI-542',
      airline: 'Air India',
      originIata: 'BLR',
      destinationIata: 'VGA',
      scheduledArrivalTime: '2026-11-05T18:00:00Z',
      status: FlightStatus.CANCELLED,
      delayMinutes: 0,
    });

    expect(updates.length).toBe(1);
    expect(updates[0].status).toBe('FLIGHT_CANCELLED_REFUNDED');
  });
});
