import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PantographChargingService } from '../src/modules/pantograph-charging/pantograph-charging.service';
import { PantographChargingController } from '../src/modules/pantograph-charging/pantograph-charging.controller';
import { PantographChargingSessionEntity } from '../src/database/entities/pantograph-charging-session.entity';

describe('PantographChargingModule', () => {
  let service: PantographChargingService;
  let controller: PantographChargingController;

  const mockSession: Partial<PantographChargingSessionEntity> = {
    id: 'mock-panto-uuid',
    sessionNumber: 'PANTO-BZA-001',
    busId: 'EV-BUS-AP37-0100',
    stationId: 'PNBS-PANTO-BAY-01',
    chargerBayNumber: 1,
    contactPressureNewtons: 120.0,
    alignmentStatus: 'LOCKED_CONTACT',
    initialSocPct: 25,
    finalSocPct: 25,
    energyDeliveredKwh: 0,
    peakPowerKw: 350,
    tariffPaisePerKwh: 850,
    totalCostPaise: 0,
    startedAt: new Date(),
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-panto-uuid',
      startedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'mock-panto-uuid') {
        return { ...mockSession };
      }
      return null;
    }),
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PantographChargingController],
      providers: [
        PantographChargingService,
        {
          provide: getRepositoryToken(PantographChargingSessionEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<PantographChargingService>(PantographChargingService);
    controller = module.get<PantographChargingController>(PantographChargingController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should start automated high-power pantograph charging session with contact pressure feedback', async () => {
    const session = await controller.startSession({
      busId: 'EV-BUS-AP37-0100',
      stationId: 'PNBS-PANTO-BAY-01',
      chargerBayNumber: 1,
      initialSocPct: 25,
      targetSocPct: 90,
      powerRatingKw: 350,
    });

    expect(session.alignmentStatus).toBe('LOCKED_CONTACT');
    expect(session.contactPressureNewtons).toBe(120.0);
    expect(session.peakPowerKw).toBe(350);
  });

  it('should stop pantograph charging, disengage head, and compute delivered energy billing in paise', async () => {
    const stopped = await controller.stopSession('mock-panto-uuid', { finalSocPct: 85 });

    expect(stopped.alignmentStatus).toBe('DISENGAGED');
    expect(stopped.finalSocPct).toBe(85);
    expect(stopped.energyDeliveredKwh).toBeGreaterThan(0);
    expect(stopped.totalCostPaise).toBeGreaterThan(0);
  });
});
