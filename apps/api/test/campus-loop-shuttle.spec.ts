import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CampusLoopService } from '../src/modules/campus-loop/campus-loop.service';
import { CampusShuttleSchedule } from '../src/database/entities/campus-shuttle-schedule.entity';

describe('CampusLoopService (M89)', () => {
  let service: CampusLoopService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'sched-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (s) => ({ ...s })),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampusLoopService,
        {
          provide: getRepositoryToken(CampusShuttleSchedule),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CampusLoopService>(CampusLoopService);
  });

  it('should create high-frequency zero-emission shuttle schedule for AIIMS Mangalagiri', async () => {
    const schedule = await service.createSchedule({
      campusCode: 'AIIMS_MANGALAGIRI',
      loopName: 'OPD to Medical College Loop',
      vehicleType: 'VAN_COMMUTE_4W',
      operatingFrequencyMinutes: 8,
      firstDepartureTime: '07:00',
      lastDepartureTime: '21:00',
      farePerRidePaise: 1500, // ₹15 flat subsidized fare
      designatedStops: ['MAIN_GATE', 'OPD_BLOCK', 'EMERGENCY_WARD', 'FACULTY_QUARTERS'],
    });

    expect(schedule.campusCode).toBe('AIIMS_MANGALAGIRI');
    expect(schedule.operatingFrequencyMinutes).toBe(8);
    expect(schedule.farePerRidePaise).toBe(1500);
  });

  it('should book campus ride and issue verifiable boarding QR pass', async () => {
    const activeSched = {
      id: 'sched-uuid-1',
      campusCode: 'SRM_UNIVERSITY_AP',
      operatingFrequencyMinutes: 10,
      farePerRidePaise: 1500,
    };
    mockRepo.findOne.mockResolvedValue(activeSched);

    const booking = await service.bookRide({
      studentOrStaffId: 'SRM-STUDENT-4402',
      campusCode: 'SRM_UNIVERSITY_AP',
      scheduleId: 'sched-uuid-1',
      pickupStop: 'HOSTEL_BLOCK_C',
      dropStop: 'ACADEMIC_CENTRAL_LIBRARY',
    });

    expect(booking.campusCode).toBe('SRM_UNIVERSITY_AP');
    expect(booking.etaMinutes).toBe(5);
    expect(booking.fareChargedPaise).toBe(1500);
    expect(booking.boardingPassQrToken).toMatch(/^PASS-CAMPUS-/);
    expect(booking.status).toBe('CONFIRMED');
  });
});
