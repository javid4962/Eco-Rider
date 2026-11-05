import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { BiometricWellnessService } from '../src/modules/biometric-wellness/biometric-wellness.service';
import { CaptainWellnessScreening } from '../src/database/entities/captain-wellness-screening.entity';
import { PreFlightScreeningStatus } from '@ecoride/contracts';

describe('BiometricWellnessService (Milestone M63)', () => {
  let service: BiometricWellnessService;

  const mockScreenings: any[] = [];

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      id: `scr-${Date.now()}`,
      ...dto,
      screenedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((s) => {
      mockScreenings.push(s);
      return Promise.resolve(s);
    }),
  };

  beforeEach(async () => {
    mockScreenings.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BiometricWellnessService,
        { provide: getRepositoryToken(CaptainWellnessScreening), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<BiometricWellnessService>(BiometricWellnessService);
  });

  it('should pass screening when captain exhibits normal vitals and zero alcohol', async () => {
    const res = await service.recordScreening({
      captainId: 'captain-ap-01',
      depotId: '00000000-0000-0000-0000-000000000001',
      bloodAlcoholContentMgDl: 0.0,
      pulseOximeterSpO2Percent: 99,
      heartRateBpm: 72,
      bodyTemperatureCelsius: 36.8,
    });

    expect(res).toBeDefined();
    expect(res.status).toBe(PreFlightScreeningStatus.PASSED);
    expect(res.fitForDuty).toBe(true);
  });

  it('should fail screening with FAILED_ALCOHOL and unfit for duty when BAC is detected', async () => {
    const res = await service.recordScreening({
      captainId: 'captain-ap-02',
      depotId: '00000000-0000-0000-0000-000000000001',
      bloodAlcoholContentMgDl: 0.05,
      pulseOximeterSpO2Percent: 98,
      heartRateBpm: 75,
      bodyTemperatureCelsius: 36.7,
    });

    expect(res.status).toBe(PreFlightScreeningStatus.FAILED_ALCOHOL);
    expect(res.fitForDuty).toBe(false);
  });

  it('should fail screening with FAILED_VITALS when SpO2 is below 95%', async () => {
    const res = await service.recordScreening({
      captainId: 'captain-ap-03',
      depotId: '00000000-0000-0000-0000-000000000002',
      bloodAlcoholContentMgDl: 0.0,
      pulseOximeterSpO2Percent: 91,
      heartRateBpm: 120,
      bodyTemperatureCelsius: 38.5,
    });

    expect(res.status).toBe(PreFlightScreeningStatus.FAILED_VITALS);
    expect(res.fitForDuty).toBe(false);
  });

  it('should throw BadRequestException when required IDs are missing', async () => {
    await expect(
      service.recordScreening({
        captainId: '',
        depotId: 'depot-01',
        bloodAlcoholContentMgDl: 0.0,
        pulseOximeterSpO2Percent: 98,
        heartRateBpm: 70,
        bodyTemperatureCelsius: 36.6,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
