import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CreatePromoCodeDto,
  ValidatePromoCodeDto,
  PromoDiscountResult,
  ReferralCodeDto,
  ApplyReferralDto,
  ReferralRewardResult,
} from '@ecoride/contracts';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('promos')
  @HttpCode(HttpStatus.CREATED)
  createPromo(@Body() dto: CreatePromoCodeDto) {
    return this.loyaltyService.createPromoCode(dto);
  }

  @Get('promos')
  listPromos(@Query('activeOnly') activeOnly?: string) {
    return this.loyaltyService.listPromoCodes(activeOnly !== 'false');
  }

  @Post('promos/validate')
  @HttpCode(HttpStatus.OK)
  validatePromo(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: ValidatePromoCodeDto,
  ): Promise<PromoDiscountResult> {
    return this.loyaltyService.validatePromoCode(dto, actor.id);
  }

  @Get('referrals/code')
  getReferralCode(@CurrentActor() actor: CurrentActorPayload): Promise<ReferralCodeDto> {
    return this.loyaltyService.getOrCreateReferralCode(actor.id);
  }

  @Post('referrals/apply')
  @HttpCode(HttpStatus.OK)
  applyReferral(
    @CurrentActor() actor: CurrentActorPayload,
    @Body() dto: ApplyReferralDto,
  ) {
    return this.loyaltyService.applyReferralCode(actor.id, dto.referralCode);
  }

  @Post('referrals/reward')
  @HttpCode(HttpStatus.OK)
  triggerReward(
    @Body() body: { refereeUserId: string; firstRideFarePaise: number },
  ): Promise<ReferralRewardResult> {
    return this.loyaltyService.completeReferralReward(
      body.refereeUserId,
      body.firstRideFarePaise,
    );
  }

  @Post('notifications/render')
  @HttpCode(HttpStatus.OK)
  renderNotification(
    @Body()
    body: {
      template: 'BOOKING_CONFIRMED' | 'CAPTAIN_ARRIVED' | 'TRIP_STARTED' | 'TRIP_COMPLETED' | 'REFERRAL_REWARD';
      language: 'te' | 'en';
      params: Record<string, string>;
    },
  ) {
    return this.loyaltyService.renderNotification(body.template, body.language, body.params);
  }
}

