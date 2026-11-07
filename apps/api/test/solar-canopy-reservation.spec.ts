import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolarCanopyReservationService } from '../src/modules/solar-canopy-reservation/solar-canopy-reservation.service';
import { SolarCanopyReservation } from '../src/database/entities/solar-canopy-reservation.entity';
import { CanopyChargingBayType, CanopyReservationStatus } from '@ecoride/contracts';

describe('SolarCanopyReservationService (M103)', () => {
  let service: SolarCanopyReservationService;
  let repo: Partial<Record<keyof Repository<SolarCanopyReservation>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-res-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolarCanopyReservationService,
        {
          provide: getRepositoryToken(SolarCanopyReservation),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<SolarCanopyReservationService>(SolarCanopyReservationService);
  });

  it('should reserve DC fast charging bay with ₹50 pre-authorization deposit and 15m grace window', async () => {
    const result = await service.reserveSlot({
      depotId: 'DEPOT-SOLAR-GNT-01',
      bayType: CanopyChargingBayType.DC_FAST_60KW,
      captainId: 'CAPTAIN-GNT-201',
      vehicleId: 'VEH-AP-37-GNT-101',
      slotStartTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      durationMinutes: 45,
    });

    expect(result.reservationId).toBeDefined();
    expect(result.bayType).toBe(CanopyChargingBayType.DC_FAST_60KW);
    expect(result.depositFeePaise).toBe(5000); // ₹50
    expect(result.status).toBe(CanopyReservationStatus.RESERVED);
    expect(result.plugInGracePeriodMinutes).toBe(15);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should check in reservation when vehicle connects charging gun', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-res-id',
      status: CanopyReservationStatus.RESERVED,
    });

    const checkedIn = await service.checkInSession({
      reservationId: 'mock-res-id',
      vehicleId: 'VEH-AP-37-GNT-101',
      currentSoC: 22.5,
    });

    expect(checkedIn.status).toBe(CanopyReservationStatus.PLUGGED_IN);
    expect(repo.save).toHaveBeenCalled();
  });
});
