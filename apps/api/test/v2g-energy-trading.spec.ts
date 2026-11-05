import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { V2gEnergyTradingService } from '../src/modules/v2g/v2g-energy-trading.service';
import { V2gDischargeSession } from '../src/database/entities/v2g-discharge-session.entity';
import { V2gDischargeStatus } from '@ecoride/contracts';

describe('V2gEnergyTradingService (Milestone M61)', () => {
  let service: V2gEnergyTradingService;

  const mockSessions: any[] = [];

  const mockRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockSessions.find((s) => s.sessionId === where.sessionId);
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `v2g-${Date.now()}`,
      ...dto,
      startedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((session) => {
      const idx = mockSessions.findIndex((s) => s.sessionId === session.sessionId);
      if (idx >= 0) {
        mockSessions[idx] = session;
      } else {
        mockSessions.push(session);
      }
      return Promise.resolve(session);
    }),
  };

  beforeEach(async () => {
    mockSessions.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        V2gEnergyTradingService,
        { provide: getRepositoryToken(V2gDischargeSession), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<V2gEnergyTradingService>(V2gEnergyTradingService);
  });

  it('should initiate V2G discharge session when SoC is above reserve threshold', async () => {
    const res = await service.initiateDischarge({
      vehicleRegistrationNumber: 'AP-16-EV-8888',
      depotId: '00000000-0000-0000-0000-000000000001',
      chargerGunId: 'GUN-BZA-01',
      currentSocPercent: 80,
      minSocThresholdPercent: 40,
      targetExportKwh: 25.0,
      feedInTariffPaisePerKwh: 850, // ₹8.50/kWh
    });

    expect(res).toBeDefined();
    expect(res.vehicleRegistrationNumber).toBe('AP-16-EV-8888');
    expect(res.status).toBe(V2gDischargeStatus.DISCHARGING);
    expect(res.totalRevenueEarnedPaise).toBe(21250); // ₹212.50
  });

  it('should reject V2G discharge initiation when vehicle SoC is at or below reserve threshold', async () => {
    await expect(
      service.initiateDischarge({
        vehicleRegistrationNumber: 'AP-16-EV-7777',
        depotId: '00000000-0000-0000-0000-000000000001',
        chargerGunId: 'GUN-BZA-02',
        currentSocPercent: 35,
        minSocThresholdPercent: 40,
        targetExportKwh: 10.0,
        feedInTariffPaisePerKwh: 850,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should complete V2G discharge session and calculate final revenue', async () => {
    const session = await service.initiateDischarge({
      vehicleRegistrationNumber: 'AP-07-EV-1234',
      depotId: '00000000-0000-0000-0000-000000000002',
      chargerGunId: 'GUN-GNT-01',
      currentSocPercent: 90,
      minSocThresholdPercent: 40,
      targetExportKwh: 30.0,
      feedInTariffPaisePerKwh: 900,
    });

    const completed = await service.completeDischarge(session.sessionId, 28.5);
    expect(completed.status).toBe(V2gDischargeStatus.COMPLETED);
    expect(completed.energyExportedKwh).toBe(28.5);
    expect(completed.totalRevenueEarnedPaise).toBe(25650); // 28.5 * 900 = 25650 paise
    expect(completed.completedAt).toBeDefined();
  });
});
