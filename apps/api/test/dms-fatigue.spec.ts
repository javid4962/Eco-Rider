import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DmsFatigueService } from '../src/modules/dms-fatigue/dms-fatigue.service';
import { DriverFatigueEvent } from '../src/database/entities/driver-fatigue-event.entity';
import { FatigueSeverity } from '@ecoride/contracts';

describe('DmsFatigueService (M75)', () => {
  let service: DmsFatigueService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'fatigue-evt-1', ...dto })),
      save: jest.fn().mockImplementation(async (evt) => ({ ...evt })),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DmsFatigueService,
        {
          provide: getRepositoryToken(DriverFatigueEvent),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<DmsFatigueService>(DmsFatigueService);
  });

  it('should evaluate NORMAL alertness for low PERCLOS and zero yawns', async () => {
    const assessment = await service.assessFatigue({
      captainId: 'capt-alert-01',
      vehicleId: 'veh-ev-01',
      perclosPercent: 12.0,
      yawnCountLastMinute: 0,
      microSleepDetected: false,
      headTiltAngleDegrees: 2.0,
      continuousDrivingMinutes: 60,
      timestamp: new Date().toISOString(),
    });

    expect(assessment.severity).toBe(FatigueSeverity.NORMAL);
    expect(assessment.hapticAlertTriggered).toBe(false);
    expect(assessment.mandatoryRestRequired).toBe(false);
  });

  it('should trigger haptic alert for MILD_DROWSINESS when yawns and moderate PERCLOS occur', async () => {
    const assessment = await service.assessFatigue({
      captainId: 'capt-tired-01',
      vehicleId: 'veh-ev-02',
      perclosPercent: 40.0, // 40 * 0.5 = 20
      yawnCountLastMinute: 3, // 3 * 8 = 24 -> score 44
      microSleepDetected: false,
      headTiltAngleDegrees: 15.0,
      continuousDrivingMinutes: 120,
      timestamp: new Date().toISOString(),
    });

    expect(assessment.severity).toBe(FatigueSeverity.MILD_DROWSINESS);
    expect(assessment.hapticAlertTriggered).toBe(true);
    expect(assessment.mandatoryRestRequired).toBe(false);
  });

  it('should enforce mandatory 30-minute rest stop when micro-sleep is detected', async () => {
    const assessment = await service.assessFatigue({
      captainId: 'capt-severe-01',
      vehicleId: 'veh-ev-03',
      perclosPercent: 55.0, // 27.5
      yawnCountLastMinute: 2, // 16
      microSleepDetected: true, // +40 -> >70
      headTiltAngleDegrees: 25.0,
      continuousDrivingMinutes: 200, // +20
      timestamp: new Date().toISOString(),
    });

    expect(assessment.severity).toBe(FatigueSeverity.SEVERE_FATIGUE);
    expect(assessment.hapticAlertTriggered).toBe(true);
    expect(assessment.mandatoryRestRequired).toBe(true);
    expect(assessment.restDurationMinutes).toBe(30);
    expect(assessment.dispatchBlockedUntil).toBeDefined();
  });
});
