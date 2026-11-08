import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IntercityElectricTransitService } from '../src/modules/intercity-electric-transit/intercity-electric-transit.service';
import { IntercityElectricTransitController } from '../src/modules/intercity-electric-transit/intercity-electric-transit.controller';
import { IntercitySeatReservationEntity } from '../src/database/entities/intercity-seat-reservation.entity';
import { IntercityRoute, IntercitySeatStatus } from '@ecoride/contracts';

describe('IntercityElectricTransitModule', () => {
  let service: IntercityElectricTransitService;
  let controller: IntercityElectricTransitController;

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-intercity-uuid',
      reservedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-intercity-uuid') {
        return {
          id: 'mock-intercity-uuid',
          status: IntercitySeatStatus.CONFIRMED,
        };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntercityElectricTransitController],
      providers: [
        IntercityElectricTransitService,
        {
          provide: getRepositoryToken(IntercitySeatReservationEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<IntercityElectricTransitService>(IntercityElectricTransitService);
    controller = module.get<IntercityElectricTransitController>(IntercityElectricTransitController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should successfully reserve seat on express intercity route with 5% AP GST and QR boarding pass', async () => {
    const reservation = await controller.reserve({
      passengerId: 'PASSENGER-AP-9901',
      route: IntercityRoute.AMARAVATHI_VIJAYAWADA_EXPRESS,
      departureTime: '2026-11-08T08:30:00Z',
      requestedSeatNumber: 12,
      maxCoachCapacity: 32,
      baseFarePaise: 20000, // ₹200.00
    });

    expect(reservation.route).toBe(IntercityRoute.AMARAVATHI_VIJAYAWADA_EXPRESS);
    expect(reservation.seatNumber).toBe(12);
    expect(reservation.gstPaise).toBe(1000); // 5% of 20,000 paise = ₹10.00
    expect(reservation.farePaidPaise).toBe(21000); // ₹210.00
    expect(reservation.status).toBe(IntercitySeatStatus.CONFIRMED);
    expect(reservation.qrBoardingPassPayload).toContain('ECORIDE-PASS-');
  });

  it('should reject reservation if requested seat number exceeds max coach capacity', async () => {
    await expect(
      controller.reserve({
        passengerId: 'PASSENGER-AP-9901',
        route: IntercityRoute.AMARAVATHI_VIJAYAWADA_EXPRESS,
        departureTime: '2026-11-08T08:30:00Z',
        requestedSeatNumber: 35, // Exceeds 32!
        maxCoachCapacity: 32,
        baseFarePaise: 20000,
      }),
    ).rejects.toThrow('Requested seat 35 exceeds coach capacity of 32');
  });
});
