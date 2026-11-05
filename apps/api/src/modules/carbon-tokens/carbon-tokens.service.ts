import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CarbonTokenWalletDto,
  CarbonRewardProductDto,
  RedeemCarbonTokensDto,
  CarbonRedemptionReceiptDto,
  CarbonRewardCategory,
} from '@ecoride/contracts';
import { CarbonTokenWallet } from '../../database/entities/carbon-token-wallet.entity';
import { CarbonRewardRedemption } from '../../database/entities/carbon-reward-redemption.entity';

@Injectable()
export class CarbonTokensService {
  constructor(
    @InjectRepository(CarbonTokenWallet)
    private readonly walletRepo: Repository<CarbonTokenWallet>,
    @InjectRepository(CarbonRewardRedemption)
    private readonly redemptionRepo: Repository<CarbonRewardRedemption>,
  ) {}

  private readonly catalog: CarbonRewardProductDto[] = [
    {
      id: 'prod-01',
      code: 'APSRTC_PASS_50',
      title: 'APSRTC Feeder ₹50 Off Voucher',
      description: '₹50 discount on APSRTC bus interchange feeder tickets in Vijayawada/Guntur',
      category: CarbonRewardCategory.TRANSIT_PASS_DISCOUNT,
      tokenCost: 20,
      cashEquivalentPaise: 5000,
      partnerName: 'APSRTC',
      stockAvailable: 500,
    },
    {
      id: 'prod-02',
      code: 'TREE_PLANT_AMARAVATHI',
      title: 'Amaravathi Green Canopy Tree Planting',
      description: 'Plant a native neem/peepal sapling in the Amaravathi Capital Riverfront Greenbelt',
      category: CarbonRewardCategory.TREE_PLANTING_CONTRIBUTION,
      tokenCost: 50,
      cashEquivalentPaise: 15000,
      partnerName: 'AP Forest Development Corporation',
      stockAvailable: 1000,
    },
    {
      id: 'prod-03',
      code: 'SOLAR_CAFE_COFFEE',
      title: 'Solar Cafe Organic Beverage',
      description: 'One complimentary organic cold brew at Solar Cafe Benz Circle',
      category: CarbonRewardCategory.SOLAR_CAFE_VOUCHER,
      tokenCost: 15,
      cashEquivalentPaise: 12000,
      partnerName: 'Solar Cafe VJA',
      stockAvailable: 250,
    },
  ];

  async getWallet(userId: string): Promise<CarbonTokenWalletDto> {
    let wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepo.create({
        userId,
        totalTokensMinted: 50,
        totalTokensRedeemed: 0,
        availableBalanceTokens: 50,
        totalCo2AvoidedKg: 125.0,
        tierBadge: 'GREEN_COMMUTER',
      });
      wallet = await this.walletRepo.save(wallet);
    }

    return {
      userId: wallet.userId,
      totalTokensMinted: wallet.totalTokensMinted,
      totalTokensRedeemed: wallet.totalTokensRedeemed,
      availableBalanceTokens: wallet.availableBalanceTokens,
      totalCo2AvoidedKg: Number(wallet.totalCo2AvoidedKg),
      tierBadge: wallet.tierBadge,
    };
  }

  getCatalog(): CarbonRewardProductDto[] {
    return this.catalog;
  }

  async redeemTokens(dto: RedeemCarbonTokensDto): Promise<CarbonRedemptionReceiptDto> {
    const existing = await this.redemptionRepo.findOne({ where: { idempotencyKey: dto.idempotencyKey } });
    if (existing) {
      return {
        redemptionId: existing.id,
        voucherCode: existing.voucherCode,
        productTitle: existing.productTitle,
        tokensDeducted: existing.tokensDeducted,
        remainingTokenBalance: 0,
        redeemedAt: existing.redeemedAt.toISOString(),
      };
    }

    const product = this.catalog.find((p) => p.id === dto.productId);
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found in rewards catalog`);
    }

    let wallet = await this.walletRepo.findOne({ where: { userId: dto.userId } });
    if (!wallet) {
      wallet = await this.walletRepo.save(
        this.walletRepo.create({
          userId: dto.userId,
          totalTokensMinted: 50,
          totalTokensRedeemed: 0,
          availableBalanceTokens: 50,
          totalCo2AvoidedKg: 125.0,
        }),
      );
    }

    if (wallet.availableBalanceTokens < product.tokenCost) {
      throw new BadRequestException(
        `Insufficient carbon token balance. Required: ${product.tokenCost}, Available: ${wallet.availableBalanceTokens}`,
      );
    }

    wallet.availableBalanceTokens -= product.tokenCost;
    wallet.totalTokensRedeemed += product.tokenCost;
    await this.walletRepo.save(wallet);

    const voucherCode = `ECO-${product.code.substring(0, 6)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const redemption = this.redemptionRepo.create({
      userId: dto.userId,
      productId: product.id,
      productTitle: product.title,
      voucherCode,
      tokensDeducted: product.tokenCost,
      idempotencyKey: dto.idempotencyKey,
    });

    const saved = await this.redemptionRepo.save(redemption);

    return {
      redemptionId: saved.id,
      voucherCode: saved.voucherCode,
      productTitle: saved.productTitle,
      tokensDeducted: saved.tokensDeducted,
      remainingTokenBalance: wallet.availableBalanceTokens,
      redeemedAt: saved.redeemedAt.toISOString(),
    };
  }
}
