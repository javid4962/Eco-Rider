import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HighwayFastChargingService } from '../src/modules/highway-fast-charging/highway-fast-charging.service';
import { HighwayChargingReservation } from '../src/database/entities/highway-charging-reservation.entity';
import { HighwaySlotStatus } from '@ecoride/contracts';

describe('HighwayFastChargingService (Milestone M65)', () => {
  let service: HighwayFastChargingService;

  const mockReservations: any[] = [];

  const mockRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockReservations.find((r) => r.reservationId === where.reservationId);
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `hwy-${Date.now()}`,
      ...dto,
      reservedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((r) => {
      const idx = mockReservations.findIndex((item) => item.reservationId === r.reservationId);
      if (idx >= 0) {
        mockReservations[idx] = r;
      } else {
        mockReservations.push(r);
      }
      return Promise.resolve(r);
    }),
  };

  beforeEach(async () => {
    mockReservations.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HighwayFastChargingService,
        { provide: getRepositoryToken(HighwayChargingReservation), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<HighwayFastChargingService>(HighwayFastChargingService);
  });

  it('should reserve highway fast charging slot on NH-16', async () => {
    const res = await service.reserveSlot({
      vehicleRegistrationNumber: 'AP-16-EV-5555',
      highwayPlazaId: 'PLAZA-KAZA-TOLL-01',
      highwayName: 'NH-16',
      targetArrivalWindowStart: '2026-11-10T14:00:00.000Z',
      targetArrivalWindowEnd: '2026-11-10T14:45:00.000Z',
    });

    expect(res).toBeDefined();
    expect(res.vehicleRegistrationNumber).toBe('AP-16-EV-5555');
    expect(res.status).toBe(HighwaySlotStatus.RESERVED);
    expect(res.depositPaise).toBe(10000);
    expect(res.bayNumber).toMatch(/^BAY-\d{2}$/);
  });

  it('should cancel reservation and update status to NO_SHOW_CANCELLED', async () => {
    const res = await service.reserveSlot({
      vehicleRegistrationNumber: 'AP-07-EV-2222',
      highwayPlazaId: 'PLAZA-POTTIPADU-02',
      highwayName: 'NH-16',
      targetArrivalWindowStart: '2026-11-10T15:00:00.000Z',
      targetArrivalWindowEnd: '2026-11-10T15:30:00.000Z',
    });

    const cancelled = await service.cancelReservation(res.reservationId);
    expect(cancelled.status).toBe(HighwaySlotStatus.NO_SHOW_CANCELLED);
  });

  it('should reject reservation when arrival window end <= start', async () => {
    await expect(
      service.reserveSlot({
        vehicleRegistrationNumber: 'AP-16-EV-1111',
        highwayPlazaId: 'PLAZA-KAZA-TOLL-01',
        highwayName: 'NH-16',
        targetArrivalWindowStart: '2026-11-10T16:00:00.000Z',
        targetArrivalWindowEnd: '2026-11-10T15:30:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException on cancelling nonexistent reservation', async () => {
    await expect(service.cancelReservation('HWY-NONEXISTENT')).rejects.toThrow(NotFoundException);
  });
});

