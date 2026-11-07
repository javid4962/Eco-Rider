import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MicroMobilityBountyService } from '../src/modules/micro-mobility-bounty/micro-mobility-bounty.service';
import { MicroMobilityBounty } from '../src/database/entities/micro-mobility-bounty.entity';
import { BountyStatus, NoParkingZoneCode } from '@ecoride/contracts';

describe('MicroMobilityBountyService (M97)', () => {
  let service: MicroMobilityBountyService;
  let repo: Partial<Record<keyof Repository<MicroMobilityBounty>, jest.Mock>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => ({ ...dto, id: 'mock-bounty-id', createdAt: new Date() })),
      save: jest.fn().mockImplementation(async (entity) => entity),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicroMobilityBountyService,
        {
          provide: getRepositoryToken(MicroMobilityBounty),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<MicroMobilityBountyService>(MicroMobilityBountyService);
  });

  it('should detect illegal parking on Benz Circle Flyover, deny lock, levy ₹150 penalty and post retrieval bounty', async () => {
    const result = await service.validateDockingLocation({
      vehicleId: 'E-SCOOT-VJA-101',
      sessionId: 'SESSION-MICRO-01',
      latitude: 16.5000, // Benz circle flyover
      longitude: 80.6500,
    });

    expect(result.isAllowedToLock).toBe(false);
    expect(result.isInNoParkingZone).toBe(true);
    expect(result.zoneCode).toBe(NoParkingZoneCode.BENZ_CIRCLE_FLYOVER);
    expect(result.penaltyFeePaise).toBe(15000); // ₹150
    expect(result.bountyCreated).toBe(true);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should allow docking in designated parking zones without penalty', async () => {
    const result = await service.validateDockingLocation({
      vehicleId: 'E-SCOOT-VJA-102',
      sessionId: 'SESSION-MICRO-02',
      latitude: 16.5200, // safe location away from no-parking polygons
      longitude: 80.6200,
    });

    expect(result.isAllowedToLock).toBe(true);
    expect(result.isInNoParkingZone).toBe(false);
    expect(result.penaltyFeePaise).toBe(0);
    expect(result.bountyCreated).toBe(false);
  });

  it('should allow captain to claim bounty and complete redock to receive ₹75 reward', async () => {
    repo.findOne = jest.fn().mockResolvedValue({
      id: 'mock-bounty-id',
      vehicleId: 'E-SCOOT-VJA-101',
      sessionId: 'SESSION-MICRO-01',
      bountyRewardPaise: 7500,
      status: BountyStatus.CLAIMED,
      claimedByCaptainId: 'CAPTAIN-RETRIEVAL-01',
      dockedHubId: null,
      completedAt: null,
    });

    const settlement = await service.completeBountyRedock({
      bountyId: 'mock-bounty-id',
      captainId: 'CAPTAIN-RETRIEVAL-01',
      dockedHubId: 'HUB-BENZ-CIRCLE-DOCK',
    });

    expect(settlement.bountyId).toBe('mock-bounty-id');
    expect(settlement.captainId).toBe('CAPTAIN-RETRIEVAL-01');
    expect(settlement.rewardPaise).toBe(7500); // ₹75
    expect(settlement.status).toBe(BountyStatus.VERIFIED_REDOCKED);
  });
});

