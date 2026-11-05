import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DriverFatigueService } from '../src/modules/fatigue/driver-fatigue.service';
import { DriverFatigueController } from '../src/modules/fatigue/driver-fatigue.controller';
import { DriverDutyLog } from '../src/database/entities/driver-duty-log.entity';
import { FatigueRiskLevel } from '@ecoride/contracts';

describe('DriverFatigueService (M43)', () => {
  let service: DriverFatigueService;
  let mockDutyRepo: any;

  beforeEach(async () => {
    mockDutyRepo = {
      create: jest.fn((e) => ({ ...e, id: 'duty-123' })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverFatigueController],
      providers: [
        DriverFatigueService,
        { provide: getRepositoryToken(DriverDutyLog), useValue: mockDutyRepo },
      ],
    }).compile();

    service = module.get<DriverFatigueService>(DriverFatigueService);
  });

  it('should maintain NORMAL duty status under statutory driving limits', async () => {
    mockDutyRepo.findOne.mockResolvedValueOnce(null);

    const log = await service.ingestTelemetry({
      captainId: 'c0000000-0000-4000-8000-000000000001',
      sessionDrivingMinutes: 120,
    });

    expect(log.fatigueRiskLevel).toBe(FatigueRiskLevel.NORMAL);
    expect(log.isDispatchBlocked).toBe(false);
  });

  it('should enforce mandatory 30-minute lockout when continuous driving exceeds 4.5 hours (270 mins)', async () => {
    mockDutyRepo.findOne.mockResolvedValueOnce({
      id: 'duty-123',
      captainId: 'c0000000-0000-4000-8000-000000000001',
      shiftStartTime: new Date(),
      continuousDrivingMinutes: 240,
      totalDailyDrivingMinutes: 240,
      consecutiveRestMinutes: 0,
      fatigueRiskLevel: FatigueRiskLevel.NORMAL,
      isDispatchBlocked: false,
    });

    const log = await service.ingestTelemetry({
      captainId: 'c0000000-0000-4000-8000-000000000001',
      sessionDrivingMinutes: 35, // 240 + 35 = 275 mins (> 270)
    });

    expect(log.fatigueRiskLevel).toBe(FatigueRiskLevel.HIGH_MANDATORY_REST);
    expect(log.isDispatchBlocked).toBe(true);
    expect(log.lockoutExpiresAt).toBeDefined();
  });

  it('should immediately trigger fatigue lockout on drowsiness sensor alert', async () => {
    mockDutyRepo.findOne.mockResolvedValueOnce(null);

    const log = await service.ingestTelemetry({
      captainId: 'c0000000-0000-4000-8000-000000000001',
      sessionDrivingMinutes: 45,
      drowsinessSensorAlert: true,
    });

    expect(log.fatigueRiskLevel).toBe(FatigueRiskLevel.HIGH_MANDATORY_REST);
    expect(log.isDispatchBlocked).toBe(true);
  });
});

