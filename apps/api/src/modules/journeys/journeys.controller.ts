import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { JourneysService } from './journeys.service';
import {
  UserStory,
  JourneyFlow,
  ScreenNode,
  ScreenGraphValidationResult,
} from '@ecoride/contracts';

export interface TransitionValidationDto {
  type: string;
  fromState: string;
  toState: string;
  actor: string;
}

@Controller('journeys')
export class JourneysController {
  constructor(private readonly journeysService: JourneysService) {}

  @Get('stories')
  getUserStories(
    @Query('role') role?: string
  ): { stories: readonly UserStory[] | UserStory[] } {
    if (role) {
      return {
        stories: this.journeysService.getUserStoriesByRole(role),
      };
    }
    return {
      stories: this.journeysService.getAllUserStories(),
    };
  }

  @Get('flows')
  getAllFlows(): { flows: readonly JourneyFlow[] } {
    return {
      flows: this.journeysService.getAllJourneys(),
    };
  }

  @Get('flows/:type')
  getFlowByType(@Param('type') type: string): { flow: JourneyFlow } {
    return {
      flow: this.journeysService.getJourneyByType(type),
    };
  }

  @Get('screens')
  getAllScreens(): { screens: readonly ScreenNode[] } {
    return {
      screens: this.journeysService.getAllScreens(),
    };
  }

  @Get('graph-validation')
  validateGraph(): ScreenGraphValidationResult {
    return this.journeysService.validateScreenGraph();
  }

  @Post('validate-transition')
  validateTransition(
    @Body() dto: TransitionValidationDto
  ): { valid: boolean; reason?: string } {
    if (!dto || !dto.type || !dto.fromState || !dto.toState || !dto.actor) {
      throw new BadRequestException(
        'type, fromState, toState, and actor are required in request body.'
      );
    }
    return this.journeysService.validateTransition(
      dto.type,
      dto.fromState,
      dto.toState,
      dto.actor
    );
  }
}

