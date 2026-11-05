export enum CarbonRewardCategory {
  TRANSIT_PASS_DISCOUNT = 'TRANSIT_PASS_DISCOUNT',
  TREE_PLANTING_CONTRIBUTION = 'TREE_PLANTING_CONTRIBUTION',
  SOLAR_CAFE_VOUCHER = 'SOLAR_CAFE_VOUCHER',
  EV_MERCHANDISE = 'EV_MERCHANDISE',
}

export interface CarbonTokenWalletDto {
  userId: string;
  totalTokensMinted: number;
  totalTokensRedeemed: number;
  availableBalanceTokens: number;
  totalCo2AvoidedKg: number;
  tierBadge: string;
}

export interface CarbonRewardProductDto {
  id: string;
  code: string;
  title: string;
  description: string;
  category: CarbonRewardCategory;
  tokenCost: number;
  cashEquivalentPaise: number;
  partnerName: string;
  stockAvailable: number;
}

export interface RedeemCarbonTokensDto {
  userId: string;
  productId: string;
  idempotencyKey: string;
}

export interface CarbonRedemptionReceiptDto {
  redemptionId: string;
  voucherCode: string;
  productTitle: string;
  tokensDeducted: number;
  remainingTokenBalance: number;
  redeemedAt: string;
}

