import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommuterPassesService } from './commuter-passes.service';
import { CurrentActor, CurrentActorPayload } from '../identity/current-actor.decorator';
import {
  PassPlanDto,
  CreatePassPlanDto,
  PurchasePassDto,
  CommuterPassDto,
  RedeemPassDto,
  RedeemPassResponse,
  SlaDelayCompensationDto,
  SlaCompensationResponse,
} from '@ecoride/contracts';

@Controller('commuter-passes')
export class CommuterPassesController {
  constructor(private readonly passesService: CommuterPassesService) {}

  @Get('plans')
  async listPlans(@Query('city') city?: string): Promise<PassPlanDto[]> {
    return this.passesService.listPlans(city);
  }

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Body() dto: CreatePassPlanDto): Promise<PassPlanDto> {
    return this.passesService.createPlan(dto);
  }

  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  async purchasePass(
    @Body() dto: PurchasePassDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<CommuterPassDto> {
    return this.passesService.purchasePass(actor, dto);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  async redeemPass(
    @Body() dto: RedeemPassDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<RedeemPassResponse> {
    return this.passesService.redeemPass(actor, dto);
  }

  @Post('sla-compensation')
  @HttpCode(HttpStatus.OK)
  async applySlaCompensation(
    @Body() dto: SlaDelayCompensationDto,
    @CurrentActor() actor?: CurrentActorPayload,
  ): Promise<SlaCompensationResponse> {
    return this.passesService.applySlaDelayCompensation(actor, dto);
  }
}

