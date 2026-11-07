import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { MicroMobilityService } from '../src/modules/micro-mobility/micro-mobility.service';
import { MicroMobilitySession } from '../src/database/entities/micro-mobility-session.entity';
import { MicroMobilityVehicleType, MicroMobilitySessionStatus } from '@ecoride/contracts';

describe('MicroMobilityService (M86)', () => {
  let service: MicroMobilityService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'session-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (s) => ({ ...s })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicroMobilityService,
        {
          provide: getRepositoryToken(MicroMobilitySession),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<MicroMobilityService>(MicroMobilityService);
  });

  it('should reject unlocking if user wallet balance is below ₹50 (5,000 paise)', async () => {
    await expect(
      service.startSession({
        userId: 'user-student-01',
        vehicleCode: 'SCOOT-AMAR-01',
        vehicleType: MicroMobilityVehicleType.E_KICK_SCOOTER,
        dockStationId: 'DOCK-SECRETARIAT-A',
        userWalletBalancePaise: 3500, // < 5,000 paise
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should unlock e-scooter and initialize session for eligible user', async () => {
    const session = await service.startSession({
      userId: 'user-student-01',
      vehicleCode: 'SCOOT-AMAR-01',
      vehicleType: MicroMobilityVehicleType.E_KICK_SCOOTER,
      dockStationId: 'DOCK-SECRETARIAT-A',
      userWalletBalancePaise: 15000,
    });

    expect(session.status).toBe(MicroMobilitySessionStatus.UNLOCKED);
    expect(session.baseUnlockFeePaise).toBe(1000);
    expect(session.perMinuteFeePaise).toBe(200);
  });

  it('should calculate duration billing with 5% AP GST upon dock return', async () => {
    const existingSession = {
      id: 'session-uuid-1',
      vehicleCode: 'SCOOT-AMAR-01',
      baseUnlockFeePaise: 1000, // ₹10
      perMinuteFeePaise: 200,   // ₹2/min
      status: MicroMobilitySessionStatus.UNLOCKED,
    };
    mockRepo.findOne.mockResolvedValue(existingSession);

    const bill = await service.endSession({
      sessionId: 'session-uuid-1',
      dockStationId: 'DOCK-SECRETARIAT-B',
      distanceMeters: 1800,
      durationMinutes: 15,
    });

    // Base 1000 + 15 * 200 (3000) = 4000 paise (₹40.00). GST 5% = 200 paise. Total = 4200 paise (₹42.00)
    expect(bill.status).toBe(MicroMobilitySessionStatus.DOCKED_COMPLETED);
    expect(bill.gstPaise).toBe(200);
    expect(bill.totalChargedPaise).toBe(4200);
    expect(bill.dockStationVerified).toBe(true);
  });
});

