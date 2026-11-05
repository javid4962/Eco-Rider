import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TransitNfcService } from '../src/modules/transit-nfc/transit-nfc.service';
import { TransitSmartCard } from '../src/database/entities/transit-smart-card.entity';
import { NfcTapTransaction } from '../src/database/entities/nfc-tap-transaction.entity';
import { NfcCardType } from '@ecoride/contracts';

describe('TransitNfcService (Milestone M57)', () => {
  let service: TransitNfcService;

  const mockCards: any[] = [];
  const mockTaps: any[] = [];

  const mockCardRepo = {
    findOne: jest.fn().mockImplementation(({ where }) => {
      const match = mockCards.find((c) => {
        if (where.cardUidHash && c.cardUidHash !== where.cardUidHash) return false;
        if (where.isActive !== undefined && c.isActive !== where.isActive) return false;
        return true;
      });
      return Promise.resolve(match || null);
    }),
    create: jest.fn().mockImplementation((dto) => ({
      id: `card-${Date.now()}`,
      ...dto,
      issuedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((card) => {
      const idx = mockCards.findIndex((c) => c.cardUidHash === card.cardUidHash);
      if (idx >= 0) {
        mockCards[idx] = card;
      } else {
        mockCards.push(card);
      }
      return Promise.resolve(card);
    }),
  };

  const mockTapRepo = {
    create: jest.fn().mockImplementation((dto) => ({
      id: `tap-${Date.now()}`,
      ...dto,
      tappedAt: new Date(),
    })),
    save: jest.fn().mockImplementation((tap) => {
      mockTaps.push(tap);
      return Promise.resolve(tap);
    }),
  };

  beforeEach(async () => {
    mockCards.length = 0;
    mockTaps.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransitNfcService,
        { provide: getRepositoryToken(TransitSmartCard), useValue: mockCardRepo },
        { provide: getRepositoryToken(NfcTapTransaction), useValue: mockTapRepo },
      ],
    }).compile();

    service = module.get<TransitNfcService>(TransitNfcService);
  });

  it('should register a new transit NFC card with initial balance', async () => {
    const card = await service.registerCard('user-ap-01', 'NFC-UID-12345678', NfcCardType.AMARAVATHI_METRO_SMART_PASS);

    expect(card).toBeDefined();
    expect(card.cardUidHash).toBe('NFC-UID-12345678');
    expect(card.linkedWalletBalancePaise).toBe(25000);
    expect(card.cardType).toBe(NfcCardType.AMARAVATHI_METRO_SMART_PASS);
    expect(card.isActive).toBe(true);
  });

  it('should validate tap and open gate when sufficient balance exists', async () => {
    await service.registerCard('user-ap-02', 'NFC-UID-87654321', NfcCardType.APSRTC_PASS_CARD);

    const result = await service.processNfcTap({
      cardUidHash: 'NFC-UID-87654321',
      stationCode: 'BZA-PNBS-INTERCHANGE',
      fareDeductionPaise: 4500, // ₹45.00
      tapType: 'ENTRY',
    });

    expect(result.gateOpened).toBe(true);
    expect(result.fareDeductedPaise).toBe(4500);
    expect(result.remainingBalancePaise).toBe(20500);
    expect(result.stationCode).toBe('BZA-PNBS-INTERCHANGE');
  });

  it('should reject tap and keep gate closed when balance is insufficient', async () => {
    await service.registerCard('user-ap-03', 'NFC-UID-EMPTY', NfcCardType.RUPAY_NCMC_TRANSIT);
    mockCards[0].linkedWalletBalancePaise = 1000; // ₹10.00

    const result = await service.processNfcTap({
      cardUidHash: 'NFC-UID-EMPTY',
      stationCode: 'GNT-RTC-BUS-STAND',
      fareDeductionPaise: 3500, // ₹35.00
      tapType: 'ENTRY',
    });

    expect(result.gateOpened).toBe(false);
    expect(result.fareDeductedPaise).toBe(0);
    expect(result.remainingBalancePaise).toBe(1000);
  });

  it('should throw NotFoundException if card is not registered', async () => {
    await expect(
      service.processNfcTap({
        cardUidHash: 'NFC-UID-UNKNOWN',
        stationCode: 'AMW-SEED-ACCESS-STN',
        fareDeductionPaise: 2000,
        tapType: 'EXIT',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
