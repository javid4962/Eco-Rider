import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RainCoverEscrowService } from '../src/modules/rain-cover-escrow/rain-cover-escrow.service';
import { RainCoverEscrowController } from '../src/modules/rain-cover-escrow/rain-cover-escrow.controller';
import { RainCoverEscrowSessionEntity } from '../src/database/entities/rain-cover-escrow-session.entity';

describe('RainCoverEscrowModule', () => {
  let service: RainCoverEscrowService;
  let controller: RainCoverEscrowController;

  const mockActiveSession: Partial<RainCoverEscrowSessionEntity> = {
    id: 'SESSION-RC-01',
    captainId: 'CAP-AP-9901',
    vehicleId: 'EV-2W-991',
    depotHubId: 'DEPOT-BENZ-CIRCLE',
    depositPaise: 50000, // ₹500
    dailyRentalPaise: 2000, // ₹20
    accumulatedRentalPaise: 0,
    refundedDepositPaise: 0,
    status: 'ISSUED',
    issuedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000), // 2 days ago
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      ...dto,
      id: 'mock-session-uuid',
      issuedAt: new Date(),
    })),
    save: jest.fn().mockImplementation(async (entity) => entity),
    findOne: jest.fn().mockImplementation(async ({ where: { id } }) => {
      if (id === 'SESSION-RC-01') {
        return { ...mockActiveSession };
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RainCoverEscrowController],
      providers: [
        RainCoverEscrowService,
        {
          provide: getRepositoryToken(RainCoverEscrowSessionEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<RainCoverEscrowService>(RainCoverEscrowService);
    controller = module.get<RainCoverEscrowController>(RainCoverEscrowController);
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should issue rain cover canopy with ₹500 (50,000 paise) deposit escrow', async () => {
    const session = await controller.issueRainCover({
      captainId: 'CAP-AP-9901',
      vehicleId: 'EV-2W-991',
      depotHubId: 'DEPOT-BENZ-CIRCLE',
      depositPaise: 50000,
      dailyRentalPaise: 2000,
    });

    expect(session.status).toBe('ISSUED');
    expect(session.depositPaise).toBe(50000);
  });

  it('should return rain cover, deduct rental days, and refund remaining deposit', async () => {
    const returned = await controller.returnRainCover({
      sessionId: 'SESSION-RC-01',
      depotHubId: 'DEPOT-BENZ-CIRCLE',
      damageDeductionPaise: 0,
    });

    expect(returned.status).toBe('RETURNED');
    expect(returned.accumulatedRentalPaise).toBeGreaterThan(0);
    expect(returned.refundedDepositPaise).toBe(50000 - returned.accumulatedRentalPaise);
  });
});
