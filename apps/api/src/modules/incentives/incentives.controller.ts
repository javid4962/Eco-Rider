import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IncentivesService } from './incentives.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  CaptainTierDto,
  IncentiveChallengeDto,
  CaptainChallengeProgressDto,
  AwardIncentiveResultDto,
} from '@ecoride/contracts';

@Controller('incentives')
export class IncentivesController {
  constructor(private readonly incentivesService: IncentivesService) {}

  @Get('tier')
  @HttpCode(HttpStatus.OK)
  getMyTier(@CurrentActor() actor: CurrentActorPayload): Promise<CaptainTierDto> {
    return this.incentivesService.getCaptainTier(actor.id);
  }

  @Get('tier/:captainId')
  @HttpCode(HttpStatus.OK)
  getCaptainTier(@Param('captainId') captainId: string): Promise<CaptainTierDto> {
    return this.incentivesService.getCaptainTier(captainId);
  }

  @Get('challenges')
  @HttpCode(HttpStatus.OK)
  listChallenges(@Query('city') city?: string): Promise<IncentiveChallengeDto[]> {
    return this.incentivesService.listActiveChallenges(city);
  }

  @Get('challenges/:challengeId/progress')
  @HttpCode(HttpStatus.OK)
  getMyChallengeProgress(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('challengeId') challengeId: string,
  ): Promise<CaptainChallengeProgressDto> {
    return this.incentivesService.getCaptainChallengeProgress(actor.id, challengeId);
  }

  @Post('challenges/:challengeId/claim')
  @HttpCode(HttpStatus.OK)
  claimChallengeReward(
    @CurrentActor() actor: CurrentActorPayload,
    @Param('challengeId') challengeId: string,
  ): Promise<AwardIncentiveResultDto> {
    return this.incentivesService.awardChallengeReward(actor.id, challengeId);
  }
}

