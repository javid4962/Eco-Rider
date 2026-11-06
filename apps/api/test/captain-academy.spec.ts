import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CaptainAcademyService } from '../src/modules/captain-academy/captain-academy.service';
import { CaptainTrainingCertification } from '../src/database/entities/captain-training-certification.entity';
import { AcademyCourseType } from '@ecoride/contracts';

describe('CaptainAcademyService (M83)', () => {
  let service: CaptainAcademyService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'cert-uuid-1', ...dto })),
      save: jest.fn().mockImplementation(async (c) => ({ ...c })),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptainAcademyService,
        {
          provide: getRepositoryToken(CaptainTrainingCertification),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CaptainAcademyService>(CaptainAcademyService);
  });

  it('should fail certification if exam score is below 80%', async () => {
    const result = await service.processCertification({
      captainId: 'capt-apprentice-01',
      courseType: AcademyCourseType.EV_REGENERATIVE_EFFICIENCY,
      examScorePercent: 72.0,
      ecoDrivingEfficiencyKwhPer100Km: 15.0,
      completionDate: '2026-11-06T00:00:00Z',
    });

    expect(result.passed).toBe(false);
    expect(result.awardedBadge).toBe('NONE');
    expect(result.platformCommissionDiscountBps).toBe(0);
  });

  it('should award MASTER_ECO_PILOT_2026 badge and 200 bps discount for high score and low kWh/100km', async () => {
    const result = await service.processCertification({
      captainId: 'capt-pro-01',
      courseType: AcademyCourseType.EV_REGENERATIVE_EFFICIENCY,
      examScorePercent: 94.0,
      ecoDrivingEfficiencyKwhPer100Km: 10.8, // Exceptional efficiency
      completionDate: '2026-11-06T00:00:00Z',
    });

    expect(result.passed).toBe(true);
    expect(result.awardedBadge).toBe('MASTER_ECO_PILOT_2026');
    expect(result.platformCommissionDiscountBps).toBe(200);
    expect(result.verificationUrl).toContain('verify.ecoride.in');
  });
});
