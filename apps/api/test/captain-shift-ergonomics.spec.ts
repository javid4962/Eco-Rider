import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaptainShiftErgonomicsService } from '../src/modules/captain-shift-ergonomics/captain-shift-ergonomics.service';
import { CaptainShiftErgonomics } from '../src/database/entities/captain-shift-ergonomics.entity';
import { ShiftDutyStatus } from '@ecoride/contracts';

describe('CaptainShiftErgonomicsService (M102)', () => {
  let service: CaptainShiftErgonomicsService;
  let repo: Partial<Record<keyof Repository<CaptainShiftErgonomics>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-ergo-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptainShiftErgonomicsService,
        {
          provide: getRepositoryToken(CaptainShiftErgonomics),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<CaptainShiftErgonomicsService>(CaptainShiftErgonomicsService);
  });

  it('should maintain active dispatch eligibility when within safe driving limits (< 240 mins)', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);

    const result = await service.recordDutyHours({
      captainId: 'CAPTAIN-AP-101',
      continuousDrivingMinutes: 180, // 3 hours
      totalShiftMinutes: 300,        // 5 hours
    });

    expect(result.dutyStatus).toBe(ShiftDutyStatus.ACTIVE_ON_DUTY);
    expect(result.isDispatchEligible).toBe(true);
    expect(result.requiredRestMinutesRemaining).toBe(0);
    expect(result.cooldownExpiry).toBeNull();
  });

  it('should enforce mandatory 30-minute rest break upon reaching 4 hours continuous driving', async () => {
    repo.findOne = jest.fn().mockResolvedValue(null);

    const result = await service.recordDutyHours({
      captainId: 'CAPTAIN-AP-102',
      continuousDrivingMinutes: 245, // > 4 hours
      totalShiftMinutes: 245,
    });

    expect(result.dutyStatus).toBe(ShiftDutyStatus.MANDATORY_REST_REQUIRED);
    expect(result.isDispatchEligible).toBe(false);
    expect(result.requiredRestMinutesRemaining).toBe(30);
    expect(result.cooldownExpiry).toBeDefined();
    expect(repo.save).toHaveBeenCalled();
  });

  it('should reset continuous driving counter after verified 30-minute rest break at depot', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-ergo-id',
      captainId: 'CAPTAIN-AP-102',
      continuousDrivingMinutes: 245,
      totalShiftMinutes: 245,
      dutyStatus: ShiftDutyStatus.MANDATORY_REST_REQUIRED,
    });

    const result = await service.logRestBreak({
      captainId: 'CAPTAIN-AP-102',
      restHubId: 'DEPOT-BENZ-CIRCLE-REST-ROOM',
      breakDurationMinutes: 35,
    });

    expect(result.dutyStatus).toBe(ShiftDutyStatus.ACTIVE_ON_DUTY);
    expect(result.isDispatchEligible).toBe(true);
    expect(result.continuousDrivingMinutes).toBe(0);
  });
});
