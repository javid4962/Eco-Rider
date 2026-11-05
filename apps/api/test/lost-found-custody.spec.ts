import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { LostFoundCustodyService } from '../src/modules/lost-found-custody/lost-found-custody.service';
import { LostItemCustody } from '../src/database/entities/lost-item-custody.entity';
import { CustodyStatus, LostItemCategory } from '@ecoride/contracts';

describe('LostFoundCustodyService (Milestone M67)', () => {
  let service: LostFoundCustodyService;

  const mockItems: any[] = [];

  const mockRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockItems.find((i) => i.trackingBarcode === where.trackingBarcode);
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `item-${Date.now()}`,
      ...dto,
      loggedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((item) => {
      const idx = mockItems.findIndex((i) => i.trackingBarcode === item.trackingBarcode);
      if (idx >= 0) {
        mockItems[idx] = item;
      } else {
        mockItems.push(item);
      }
      return Promise.resolve(item);
    }),
  };

  beforeEach(async () => {
    mockItems.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LostFoundCustodyService,
        { provide: getRepositoryToken(LostItemCustody), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<LostFoundCustodyService>(LostFoundCustodyService);
  });

  it('should log found item and generate barcode tracking', async () => {
    const res = await service.logFoundItem({
      tripId: '00000000-0000-0000-0000-000000000001',
      captainId: 'captain-ap-01',
      itemCategory: LostItemCategory.ELECTRONICS,
      description: 'Blue OnePlus smartphone left on rear seat',
    });

    expect(res).toBeDefined();
    expect(res.trackingBarcode).toMatch(/^BC-LFT-/);
    expect(res.status).toBe(CustodyStatus.LOGGED_BY_CAPTAIN);
  });

  it('should secure item in depot secure vault locker', async () => {
    const res = await service.logFoundItem({
      tripId: '00000000-0000-0000-0000-000000000002',
      captainId: 'captain-ap-02',
      itemCategory: LostItemCategory.WALLET_CURRENCY,
      description: 'Leather wallet with ID cards',
    });

    const secured = await service.secureInVault({
      trackingBarcode: res.trackingBarcode,
      depotId: '00000000-0000-4000-8000-000000000001',
      vaultLockerNumber: 'VAULT-04',
    });

    expect(secured.status).toBe(CustodyStatus.SECURED_IN_DEPOT_VAULT);
    expect(secured.vaultLockerNumber).toBe('VAULT-04');
  });

  it('should verify rider claim with correct OTP and release custody', async () => {
    const claimOtp = '849201';
    const otpHash = crypto.createHash('sha256').update(claimOtp).digest('hex');

    const item = await service.logFoundItem({
      tripId: '00000000-0000-0000-0000-000000000003',
      captainId: 'captain-ap-03',
      itemCategory: LostItemCategory.OFFICIAL_DOCUMENTS,
      description: 'Aadhaar card envelope',
    });
    mockItems[0].claimVerificationOtpHash = otpHash;

    const claimed = await service.claimItem({
      trackingBarcode: item.trackingBarcode,
      riderId: 'rider-01',
      claimOtp,
    });

    expect(claimed.status).toBe(CustodyStatus.RETURNED_TO_OWNER);
    expect(claimed.returnedAt).toBeDefined();
  });

  it('should reject claim if OTP is invalid', async () => {
    const item = await service.logFoundItem({
      tripId: '00000000-0000-0000-0000-000000000004',
      captainId: 'captain-ap-04',
      itemCategory: LostItemCategory.OTHER,
      description: 'Umbrella',
    });

    await expect(
      service.claimItem({
        trackingBarcode: item.trackingBarcode,
        riderId: 'rider-02',
        claimOtp: '000000',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
