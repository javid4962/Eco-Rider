import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GridCurtailmentService } from '../src/modules/grid-curtailment/grid-curtailment.service';
import { GridCurtailmentEvent } from '../src/database/entities/grid-curtailment-event.entity';
import { CurtailmentLevel, GridFrequencyStatus } from '@ecoride/contracts';

describe('GridCurtailmentService (M94)', () => {
  let service: GridCurtailmentService;
  let repo: Partial<Record<keyof Repository<GridCurtailmentEvent>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-reading-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GridCurtailmentService,
        {
          provide: getRepositoryToken(GridCurtailmentEvent),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<GridCurtailmentService>(GridCurtailmentService);
  });

  it('should maintain normal operation when grid frequency is stable (50.00 Hz)', async () => {
    const result = await service.processGridFrequency({
      substationId: 'APCPDCL-SUB-VJA-01',
      gridFrequencyHz: 50.02,
      gridOperator: 'APSLDC',
      timestamp: new Date().toISOString(),
    });

    expect(result.status).toBe(GridFrequencyStatus.NORMAL);
    expect(result.curtailmentLevel).toBe(CurtailmentLevel.NONE);
    expect(result.totalCurtailedKw).toBe(0);
    expect(result.affectedGunCount).toBe(0);
    expect(result.ancillaryCreditPaisePerHour).toBe(0);
  });

  it('should trigger Tier-1 50% power throttle during moderate frequency sag (49.88 Hz)', async () => {
    const result = await service.processGridFrequency({
      substationId: 'APCPDCL-SUB-GNT-02',
      gridFrequencyHz: 49.88,
      gridOperator: 'APSLDC',
      timestamp: new Date().toISOString(),
    });

    expect(result.status).toBe(GridFrequencyStatus.WARNING_LOW);
    expect(result.curtailmentLevel).toBe(CurtailmentLevel.THROTTLE_50_PERCENT);
    expect(result.totalCurtailedKw).toBe(120);
    expect(result.affectedGunCount).toBe(8);
    expect(result.ancillaryCreditPaisePerHour).toBe(42000); // 120kW * 350 paise
    expect(repo.save).toHaveBeenCalled();
  });

  it('should trigger emergency non-essential shutdown during critical under-frequency (< 49.85 Hz)', async () => {
    const result = await service.processGridFrequency({
      substationId: 'APCPDCL-SUB-AMV-03',
      gridFrequencyHz: 49.78,
      gridOperator: 'APSLDC',
      timestamp: new Date().toISOString(),
    });

    expect(result.status).toBe(GridFrequencyStatus.CRITICAL_UNDER_FREQUENCY);
    expect(result.curtailmentLevel).toBe(CurtailmentLevel.SHUTDOWN_NON_ESSENTIAL);
    expect(result.totalCurtailedKw).toBe(240);
    expect(result.affectedGunCount).toBe(16);
    expect(result.ancillaryCreditPaisePerHour).toBe(84000); // 240kW * 350 paise
  });
});
