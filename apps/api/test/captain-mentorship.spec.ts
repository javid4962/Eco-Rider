import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CaptainMentorshipService } from '../src/modules/captain-mentorship/captain-mentorship.service';
import { CaptainMentorshipPairing } from '../src/database/entities/captain-mentorship-pairing.entity';
import { MentorshipStatus } from '@ecoride/contracts';

describe('CaptainMentorshipService (M71)', () => {
  let service: CaptainMentorshipService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({ id: 'ment-12345', ...dto })),
      save: jest.fn().mockImplementation(async (pairing) => ({ ...pairing })),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaptainMentorshipService,
        {
          provide: getRepositoryToken(CaptainMentorshipPairing),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CaptainMentorshipService>(CaptainMentorshipService);
  });

  it('should reject pairing creation if mentor tier is not GOLD or PLATINUM', async () => {
    await expect(
      service.createPairing({
        mentorCaptainId: 'capt-bronze',
        mentorTier: 'BRONZE' as any,
        menteeCaptainId: 'capt-recruit',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully create pairing for a GOLD mentor in Andhra Pradesh', async () => {
    const result = await service.createPairing({
      mentorCaptainId: 'capt-gold-01',
      mentorTier: 'GOLD',
      menteeCaptainId: 'capt-recruit-01',
      targetTrips: 100,
      bonusAmountPaise: 250000,
    });

    expect(result.mentorCaptainId).toBe('capt-gold-01');
    expect(result.status).toBe(MentorshipStatus.ACTIVE);
    expect(result.bonusAmountPaise).toBe(250000);
  });

  it('should update progress and evaluate ongoing status before target trips are reached', async () => {
    const existingPairing = {
      id: 'ment-12345',
      mentorCaptainId: 'capt-gold-01',
      menteeCaptainId: 'capt-recruit-01',
      status: MentorshipStatus.ACTIVE,
      targetTrips: 100,
      completedTrips: 50,
      minimumRating: 4.85,
      currentRating: 4.9,
      bonusAmountPaise: 250000,
    };
    mockRepo.findOne.mockResolvedValue(existingPairing);

    const progress = await service.updateProgress('ment-12345', {
      tripsIncrement: 20,
      newRating: 4.92,
    });
    expect(progress.completedTrips).toBe(70);

    const evalResult = await service.evaluateGraduation('ment-12345');
    expect(evalResult.isGraduated).toBe(false);
    expect(evalResult.bonusDisbursedPaise).toBe(0);
  });

  it('should graduate mentee and disburse bonus when requirements are met', async () => {
    const qualifiedPairing = {
      id: 'ment-grad-01',
      mentorCaptainId: 'capt-plat-01',
      menteeCaptainId: 'capt-recruit-99',
      status: MentorshipStatus.ACTIVE,
      targetTrips: 100,
      completedTrips: 105,
      minimumRating: 4.85,
      currentRating: 4.95,
      bonusAmountPaise: 250000,
    };
    mockRepo.findOne.mockResolvedValue(qualifiedPairing);

    const evalResult = await service.evaluateGraduation('ment-grad-01');
    expect(evalResult.isGraduated).toBe(true);
    expect(evalResult.bonusDisbursedPaise).toBe(250000);
    expect(evalResult.ledgerTransactionId).toBeDefined();
    expect(evalResult.status).toBe(MentorshipStatus.GRADUATED);
  });
});
