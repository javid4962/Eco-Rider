import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CarbonTokensService } from '../src/modules/carbon-tokens/carbon-tokens.service';
import { CarbonTokensController } from '../src/modules/carbon-tokens/carbon-tokens.controller';
import { CarbonTokenWallet } from '../src/database/entities/carbon-token-wallet.entity';
import { CarbonRewardRedemption } from '../src/database/entities/carbon-reward-redemption.entity';

describe('CarbonTokensService (M44)', () => {
  let service: CarbonTokensService;
  let mockWalletRepo: any;
  let mockRedemptionRepo: any;

  beforeEach(async () => {
    mockWalletRepo = {
      create: jest.fn((e) => ({ ...e, id: 'w-123' })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    mockRedemptionRepo = {
      create: jest.fn((e) => ({ ...e, id: 'r-123', redeemedAt: new Date() })),
      findOne: jest.fn(),
      save: jest.fn((e) => Promise.resolve({ ...e })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarbonTokensController],
      providers: [
        CarbonTokensService,
        { provide: getRepositoryToken(CarbonTokenWallet), useValue: mockWalletRepo },
        { provide: getRepositoryToken(CarbonRewardRedemption), useValue: mockRedemptionRepo },
      ],
    }).compile();

    service = module.get<CarbonTokensService>(CarbonTokensService);
  });

  it('should retrieve wallet and return current carbon balance', async () => {
    mockWalletRepo.findOne.mockResolvedValueOnce({
      userId: 'u0000000-0000-4000-8000-000000000001',
      totalTokensMinted: 100,
      totalTokensRedeemed: 20,
      availableBalanceTokens: 80,
      totalCo2AvoidedKg: 200.0,
      tierBadge: 'GREEN_CHAMPION',
    });

    const wallet = await service.getWallet('u0000000-0000-4000-8000-000000000001');
    expect(wallet.availableBalanceTokens).toBe(80);
    expect(wallet.tierBadge).toBe('GREEN_CHAMPION');
  });

  it('should successfully redeem carbon tokens for partner reward', async () => {
    mockRedemptionRepo.findOne.mockResolvedValueOnce(null);
    mockWalletRepo.findOne.mockResolvedValueOnce({
      userId: 'u0000000-0000-4000-8000-000000000001',
      totalTokensMinted: 100,
      totalTokensRedeemed: 0,
      availableBalanceTokens: 100,
      totalCo2AvoidedKg: 250.0,
    });

    const receipt = await service.redeemTokens({
      userId: 'u0000000-0000-4000-8000-000000000001',
      productId: 'prod-01', // APSRTC_PASS_50 costs 20 tokens
      idempotencyKey: 'idemp-token-001',
    });

    expect(receipt.tokensDeducted).toBe(20);
    expect(receipt.remainingTokenBalance).toBe(80);
    expect(receipt.voucherCode).toContain('ECO-');
  });

  it('should reject redemption if user carbon token balance is insufficient', async () => {
    mockRedemptionRepo.findOne.mockResolvedValueOnce(null);
    mockWalletRepo.findOne.mockResolvedValueOnce({
      userId: 'u0000000-0000-4000-8000-000000000001',
      availableBalanceTokens: 10, // Needs 50 for TREE_PLANT
    });

    await expect(
      service.redeemTokens({
        userId: 'u0000000-0000-4000-8000-000000000001',
        productId: 'prod-02', // Costs 50
        idempotencyKey: 'idemp-token-002',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

