import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { InterDepotRelayService } from '../src/modules/inter-depot-relay/inter-depot-relay.service';
import { InterDepotParcelRelay } from '../src/database/entities/inter-depot-parcel-relay.entity';
import { RelayHopStatus } from '@ecoride/contracts';

describe('InterDepotRelayService (M85)', () => {
  let service: InterDepotRelayService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'relay-uuid-1',
        updatedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation(async (r) => ({
        ...r,
        updatedAt: new Date(),
      })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterDepotRelayService,
        {
          provide: getRepositoryToken(InterDepotParcelRelay),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<InterDepotRelayService>(InterDepotRelayService);
  });

  it('should create an inter-depot parcel relay schedule with unique verification token', async () => {
    const result = await service.createRelay({
      consignmentId: 'CSG-VIJ-GTR-001',
      originLockerHubId: 'LOCKER-PNBS-VIJ',
      transitDepotId: 'DEPOT-MANGALAGIRI',
      destinationLockerHubId: 'LOCKER-ARUNDELPET-GTR',
      courierVanVehicleId: 'VAN-EV-01',
      courierCaptainId: 'CAPT-COURIER-01',
      weightGrams: 2500,
    });

    expect(result.status).toBe(RelayHopStatus.SCHEDULED);
    expect(result.currentLocationHub).toBe('LOCKER-PNBS-VIJ');
    expect(result.nextScheduledHub).toBe('DEPOT-MANGALAGIRI');
    expect(result.verificationToken).toMatch(/^RELAY-/);
  });

  it('should reject handshake transfer with invalid OTP format', async () => {
    const activeRelay = {
      id: 'relay-uuid-1',
      consignmentId: 'CSG-VIJ-GTR-001',
      transitDepotId: 'DEPOT-MANGALAGIRI',
      destinationLockerHubId: 'LOCKER-ARUNDELPET-GTR',
    };
    mockRepo.findOne.mockResolvedValue(activeRelay);

    await expect(
      service.verifyHandshake({
        relayId: 'relay-uuid-1',
        currentDepotId: 'DEPOT-MANGALAGIRI',
        handedOverByCaptainId: 'CAPT-01',
        receivedByCaptainId: 'CAPT-02',
        otpCode: '12', // Invalid length
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should transfer relay custody to next hop upon transit depot handover', async () => {
    const activeRelay = {
      id: 'relay-uuid-1',
      consignmentId: 'CSG-VIJ-GTR-001',
      originLockerHubId: 'LOCKER-PNBS-VIJ',
      transitDepotId: 'DEPOT-MANGALAGIRI',
      destinationLockerHubId: 'LOCKER-ARUNDELPET-GTR',
      status: RelayHopStatus.IN_TRANSIT,
      verificationToken: 'RELAY-TEST-TOKEN',
    };
    mockRepo.findOne.mockResolvedValue(activeRelay);

    const result = await service.verifyHandshake({
      relayId: 'relay-uuid-1',
      currentDepotId: 'DEPOT-MANGALAGIRI',
      handedOverByCaptainId: 'CAPT-01',
      receivedByCaptainId: 'CAPT-02',
      otpCode: '987654',
    });

    expect(result.status).toBe(RelayHopStatus.TRANSFERRED_TO_NEXT_HOP);
    expect(result.currentLocationHub).toBe('DEPOT-MANGALAGIRI');
    expect(result.nextScheduledHub).toBe('LOCKER-ARUNDELPET-GTR');
  });
});
